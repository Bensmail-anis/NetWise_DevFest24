require("dotenv").config(); // Load environment variables from a .env file
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require('cors');
const http = require("http"); // Import http module
const socketIo = require("socket.io"); // Import Socket.IO
const app = express();

const Clients =require("./models/Clients")
const Managers =require("./models/Managers")
const Bandwidth =require("./models/Bandwidth")

// Middleware setup
app.use(bodyParser.json()); // Parse incoming JSON requests
app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded requests
app.use(cors());


// Routes setup
const signIn = require("./routers/SignIn"); // SignIn route
app.use("/signIn", signIn);

const dashboard = require("./routers/Dashboard"); // Dashboard route
app.use("/dashboard", dashboard);

const simulation = require("./routers/Simulation"); // Dashboard route
app.use("/simulation", simulation);


// Create HTTP server and Socket.IO instance
const server = http.createServer(app);
const authMiddlewareSocket = require("./authMiddlewareSocket"); // Middleware for socket authentication
const authMiddleware = require("./authMiddleware");

const io = socketIo(server, {
    cors: {
        origin: "http://localhost:5173", // Remplace par l'URL de ton frontend
        methods: ["GET", "POST"],
        allowedHeaders: ["Content-Type"],
        credentials: true,
    },
});

io.use(authMiddlewareSocket); // Use authentication middleware for socket connections

// CISCO connection
/*
const axios = require('axios'); // Import axios for HTTP requests
const authMiddleware = require("./authMiddleware");
let serviceTicket = '';  // Service Ticket for authentication
const API_URL = 'http://localhost:58000/api/v1';  // PT-Controller API URL

// Function to get a service ticket
async function getServiceTicket() {
    try {
        const response = await axios.post(`${API_URL}/ticket`, {
            username: 'cisco',
            password: 'cisco123!'
        });
        serviceTicket = response.data.response.serviceTicket;
        console.log('Service Ticket obtained:', serviceTicket);
    } catch (err) {
        console.error('Error obtaining service ticket:', err);
    }
}

// Middleware to set the service ticket in headers
app.use(async (req, res, next) => {
    if (!serviceTicket) {
        await getServiceTicket();  // Obtain a service ticket if not already available
    }
    next();
});

*/
// Database connection
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI, { useNewUrlParser: true, useUnifiedTopology: true }); // Connect to MongoDB
    } catch (err) {
        console.log(err); // Log connection error
    }
};

connectDB();

mongoose.connection.once("open", () => {
    console.log("Connected to MongoDB"); // Log once MongoDB connection is successful
});


// Listen for Socket.IO connections
io.on("connection", (socket) => {
    //console.log("A manager connected : ", socket.user);

    // Function to send existing bandwidth data to the client
    const sendBandwidthData = async () => {
        const Bandwidth = require("./models/Bandwidth");
        const Clients = require("./models/Clients");
        const clients = await Clients.find().select('_id');
        // Récupérer les IDs des clients
        const clientIds = clients.map(client => client._id);
        // Trouver les enregistrements de bande passante correspondants
        const bandwidthData = await Bandwidth.find({ id_client: { $in: clientIds } }).populate("id_client").sort({_id: -1})
        socket.emit("bandwidthData", bandwidthData); // Send existing data to the connected client
    };

    // Send data when the client connects
    sendBandwidthData();

    // Listen for disconnect event
    socket.on("disconnect", () => {
        //console.log("A manager disconnected");
    });
});


// c la partie que je dois changer

app.post("/:id/alocate",authMiddleware, async (req, res) => {
    try {
        let get;
        const client = await Clients.findById(req.params.id); // Utilisez findById pour récupérer un seul document
        console.log(req.user)
        if (!client) {
            console.log("there is no client with this id");
            return res.status(404).send({ response: "there is no client with this id" });
        }

        if (!client.connected) {
            await Clients.updateOne({ _id: req.params.id }, { $set: { connected: true } });
        }

        // Vérification de la demande d'allocation
        if (req.body.want <= client.max && req.body.want <= req.user.current) {
            get = req.body.want;
        } else if (req.body.want > client.max && client.max <= req.user.current) {
            get = client.max;
        } else if (!(req.user.current==0)) {
            get = req.user.current;
        } else {
            return res.status(400).send({ response: "Bandwidth overflow" });
        }

        // Création de l'enregistrement dans la collection Bandwidth
        const bandwidth = new Bandwidth({
            id_client : client._id,
            ip_client: client.ip_adress, // Assurez-vous d'utiliser le bon champ
            get: get,
            want: req.body.want,
        });

        await bandwidth.save();
        await Managers.updateOne({_id : req.user._id}, { $inc: { current: -get } })
        console.log(bandwidth);
        // Emit the new document to all connected clients
        io.emit("newBandwidth", bandwidth);
        res.status(200).send({ response: "success allocate bandwidth" });
    } catch (error) {
        console.error("Allocation failed:", error); // Affichez l'erreur pour le débogage
        res.status(500).send("allocation failed");
    }
});

// fin partie à changer

/*
// CISCO APIs

// Route to get all hosts in the network
app.get('/hosts', authMiddleware, async (req, res) => {
    try {
        const response = await axios.get(`${API_URL}/host`, {
            headers: { 'X-Auth-Token': serviceTicket }
        });
        console.log(response.data.response)
        res.json(response.data.response);
    } catch (err) {
        console.error('Error fetching hosts:', err);
        res.status(500).send('Error fetching hosts');
    }
});

// get all hosts with bandwidthLimit
app.get('/hosts-with-bandwidth', authMiddleware, async (req, res) => {
    try {
        // Récupérer les hôtes
        const hostsResponse = await axios.get(`${API_URL}/host`, {
            headers: { 'X-Auth-Token': serviceTicket }
        });
        const hosts = hostsResponse.data.response;

        // Pour chaque hôte, récupérer la bande passante de l'interface associée
        const enrichedHosts = await Promise.all(hosts.map(async (host) => {
            try {
                const interfaceDetails = await axios.get(`${API_URL}/network-device/${host.connectedNetworkDeviceIpAddress}/interface/${host.connectedInterfaceName}`, {
                    headers: { 'X-Auth-Token': serviceTicket }
                });
                
                // Ajouter les informations de bande passante à l'hôte
                host.bandwidthLimit = interfaceDetails.data.bandwidthLimit;
            } catch (err) {
                console.error(`Error fetching bandwidth for host ${host.hostName}:`, err);
                host.bandwidthLimit = 'Unknown';
            }
            return host;
        }));

        res.json(enrichedHosts);
    } catch (err) {
        console.error('Error fetching hosts:', err);
        res.status(500).send('Error fetching hosts');
    }
});

// Route to control the bandwidth (debit) for a specific PC
app.post('/hosts/:ip/bandwidth', authMiddleware, async (req, res) => {
    const pcIp = req.params.ip;
    const { bandwidthLimit } = req.body;  // Expect bandwidthLimit in the request body
    console.log(bandwidthLimit)
    // Set default if bandwidthLimit is missing or unknown
    const limit = bandwidthLimit || "Unknown";  // Default value if bandwidthLimit is not provided
    console.log("limit : ", limit)
    // QoS API endpoint for adding/updating a policy
    const qosPolicyUrl = `${API_URL}/policy`;

    // Create a QoS policy to limit bandwidth for this PC
    const policyData = {
        policyName: `Limit_Bandwidth_${pcIp}`,
        priority: "LOW",  // or MEDIUM, HIGH depending on your requirements
        bandwidthLimit: limit,  // Set bandwidth to the provided value or "Unknown"
        targetDevice: pcIp,
        policyScope: "default", // Valeur par défaut
        actions: ["SET_PROPERTY"],
        policyActionProperty: {
            relevanceLevel: 'Business-Relevant'  // Relevance level required by API
        },
        policyResource: {
            applications: []  // Optional, can leave empty if not needed
        }  
    };
    console.log(policyData)
    try {
        const response = await axios.post(qosPolicyUrl, policyData, {
            headers: { 'X-Auth-Token': serviceTicket }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error setting bandwidth limit for PC:', error.response.data);
        res.status(500).send('Error setting bandwidth limit');
    }
});



// Route to set max bandwidth (debit) for the server
app.post('/server/bandwidth', async (req, res) => {
    const { bandwidthLimit } = req.body; 

    const qosPolicyUrl = `${API_URL}/policy`;
    const serverIp = '192.168.101.100';  // Example server IP

    const policyData = {
        policyName: 'Limit_Bandwidth_Server',
        policyScope: 'Server_Limit',
        actions: ['SET_PROPERTY'],
        policyActionProperty: {
            relevanceLevel: 'Business-Relevant'  // Ensure the relevance level matches
        },
        policyResource: {
            applications: []  // Optional
        }
    };

    try {
        // Check if the policy already exists
        const existingPolicy = await checkExistingPolicy(policyData.policyName, policyData.policyActionProperty.relevanceLevel);

        if (existingPolicy) {
            console.log('Policy already exists, updating the existing policy...');
            const updateUrl = `${API_URL}/policy/${existingPolicy.id}`;  // Use the correct URL for updates
            const response = await axios.put(updateUrl, policyData, {
                headers: { 'X-Auth-Token': serviceTicket }
            });
            return res.json(response.data);
        }

        // If no existing policy, create a new one
        const response = await axios.post(qosPolicyUrl, policyData, {
            headers: { 'X-Auth-Token': serviceTicket }
        });
        res.json(response.data);
    } catch (error) {
        console.error('Error setting max bandwidth for server:', error.response.data);
        res.status(500).send('Error setting max bandwidth for server');
    }
});


// Function to check if a policy with the same name and relevance level exists
async function checkExistingPolicy(policyName, relevanceLevel) {
    try {
        // Limite le nombre de résultats à 100 par exemple
        const response = await axios.get(`${API_URL}/policy?policyName=${policyName}&limit=100`, {
            headers: { 'X-Auth-Token': serviceTicket }
        });

        // Filtrer les politiques par niveau de pertinence
        const existingPolicies = response.data.filter(policy => 
            policy.policyActionProperty.relevanceLevel === relevanceLevel
        );
        return existingPolicies.length > 0 ? existingPolicies[0] : null; // Retourne la première politique correspondante
    } catch (error) {
        console.error('Error checking existing policy:', error.reason);
        return null; // Retourne null en cas d'erreur
    }
}

*/




// Start the server
const PORT = process.env.PORT || 5000; // Set port from environment or default to 5000
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
});

// Fallback for non-existing routes
app.use((req, res, next) => {
    res.status(404).json({
        error: 'Not Found',
        message: 'The requested resource was not found.'
    });
});







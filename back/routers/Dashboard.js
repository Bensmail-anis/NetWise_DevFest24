require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require('mongoose');
const authMiddleware = require("../authMiddleware");
const dashboardRouter = express.Router();
const Clients = require("../models/Clients")
const Managers = require("../models/Managers")
const Bandwidth = require("../models/Bandwidth")


// get all clients
dashboardRouter.get("/", authMiddleware, async(req, res) => {
    try{
        const clients = await Clients.find()
        if(!clients) {
            console.log("There is no clients")
            res.status(404).send({response : "There is no clients"})
        }
        res.status(200).send(clients)
    }catch(err) {
        console.log("error get all clients")
        res.status(500).send("error get all clients : ", err)
    }
})

// get connected clients
dashboardRouter.get("/connected", authMiddleware, async(req, res) => {
    try{
        console.log(req.user._id)
        const clients = await Clients.find({connected:true})
        if(!clients) {
            console.log("There is no connected clients")
            res.status(404).send({response : "There is no connected clients"})
        }
        res.status(200).send(clients)
    }catch(err) {
        console.log("error get connected clients")
        res.status(500).send("error get connected clients : ", err)
    }
})


// change max 
dashboardRouter.post('/max', authMiddleware, async(req, res) => {
    try{
        await Managers.updateOne({_id : req.user._id}, {$set: {max: req.body.max, current : req.body.max}})
        console.log("success update max")
        res.status(200).send({response: "success update max"})
    }catch(err){
        console.log("error update max")
        res.status(500).send("error update max : ", err)
    }
})

// change max of a client
dashboardRouter.post('/:id/maxClient', authMiddleware, async(req, res) => {
    try{
        await Clients.updateOne({_id : req.params.id}, {$set: {max: req.body.max}})
        console.log("success update max client")
        res.status(200).send({response: "success update max client"})
    }catch(err){
        console.log("error update max client")
        res.status(500).send("error update max client : ", err)
    }
})

// connected clients per hour 
dashboardRouter.get('/clients-connected-per-hour', authMiddleware, async (req, res) => {
    try {
        const past24Hours = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        
        const connectedClientsByHour = await Bandwidth.aggregate([
            {
                $lookup: {
                    from: "clients",
                    localField: "id_client",
                    foreignField: "_id",
                    as: "clientInfo"
                }
            },
            {
                $unwind: "$clientInfo"
            },
            {
                $match: {
                    "clientInfo.connected": true,
                    timestamp: { $gte: past24Hours }
                }
            },
            {
                $group: {
                    _id: { $hour: "$timestamp" },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);
        console.log("sucess")
        res.json(connectedClientsByHour);
    } catch (error) {
        console.error('Error get clients connected per hour:', error);
        res.status(500).json({ message: 'Error get clients connected per hour' });
    }
});

// get nbr alocations per hour
dashboardRouter.get('/bandwidth-per-hour', authMiddleware, async (req, res) => {
    try {
        const past24Hours = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        
        const bandwidthAllocationsByHour = await Bandwidth.aggregate([
            {
                $match: {
                    timestamp: { $gte: past24Hours } // On filtre sur les 24 dernières heures
                }
            },
            {
                $group: {
                    _id: { $hour: "$timestamp" }, // Grouper par heure
                    count: { $sum: 1 } // Compter le nombre d'allocations
                }
            },
            {
                $sort: { _id: 1 } // Trier par heure croissante
            }
        ]);

        res.json(bandwidthAllocationsByHour);
    } catch (error) {
        console.error('Erreur lors de la récupération des allocations de bande passante par heure :', error);
        res.status(500).json({ message: 'Erreur lors de la récupération des allocations de bande passante par heure', error: error.message });
    }
});

//disconnect
dashboardRouter.post("/:id/disconnect", authMiddleware, async(req, res) => {
    try {
        // Met à jour le client pour déconnecter
        await Clients.updateOne({_id: req.params.id}, {$set: {connected: false}});
        console.log("Client disconnected successfully");

        // Recherchez tous les documents dans Bandwidth avec id_client égal à req.params.id
        const bandwidths = await Bandwidth.find({ id_client: req.params.id });

        // Additionne toutes les valeurs `get` des documents trouvés
        const totalGet = bandwidths.reduce((acc, bandwidth) => acc + bandwidth.get, 0);
        console.log("Total `get` to be added back:", totalGet);

        // Incrémente le `current` de l'utilisateur en utilisant la somme calculée
        await Managers.updateOne({ _id: req.user._id }, { $inc: { current: totalGet } });
        console.log("Manager current updated successfully");

        res.status(200).send({ response: "success" });
    } catch (err) {
        console.log("Error during disconnect:", err);
        res.status(500).send({ response: "Error during disconnect" });
    }
});




module.exports = dashboardRouter
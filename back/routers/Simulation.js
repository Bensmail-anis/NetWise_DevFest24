require("dotenv").config(); // Load environment variables from .env file
const express = require("express");
const mongoose = require('mongoose');
const authMiddleware = require("../authMiddleware");
const simulationRouter = express.Router();
const Clients = require("../models/Clients")
const Managers = require("../models/Managers")
const Bandwidth = require("../models/Bandwidth")


// allocate bandwidth
simulationRouter.post("/:id/alocate", authMiddleware, async (req, res) => {
    try {
        let get;
        const client = await Clients.findById(req.params.id); // Utilisez findById pour récupérer un seul document

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
        } else if (req.body.want > client.max && client.max > req.user.current) {
            get = req.user.current;
        } else {
            return res.status(400).send({ response: "Bandwidth overflow" });
        }

        // Création de l'enregistrement dans la collection Bandwidth
        const bandwidth = new Bandwidth({
            ip_client: client.ip_adress, // Assurez-vous d'utiliser le bon champ
            get: get,
            want: req.body.want,
        });

        await bandwidth.save();
        await Managers.updateOne({_id : req.user.id}, {$set : {current : current - get}})
        console.log(bandwidth);
        res.status(200).send({ response: "success allocate bandwidth" });
    } catch (error) {
        console.error("Allocation failed:", error); // Affichez l'erreur pour le débogage
        res.status(500).send("allocation failed");
    }
});




module.exports = simulationRouter
import express from "express";
import fetch from "node-fetch"; 


const router = express.Router();

router.get('/:platform/:id', async (req, res) => {
    
    try {


        console.log(process.env.TRACKERGG_URL,process.env.TRACKERGG_API);
        const headers = {
            'TRN-Api-Key': process.env.TRACKERGG_API
        }


        const {platform,id} = req.params;

        console.log(platform,id);
        const response = await fetch(`${process.env.TRACKERGG_URL}/profile/${platform}/${id}`,
            {
            headers
            }
    );

        const data = await response.json();

        res.json(data);

    } catch (error) {
        res.status(500).json({message: 'Server Error' })
    }
}); 

export default router;


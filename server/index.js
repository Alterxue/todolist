require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const app = express();

const port = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/register',async(req,res)=>{
    const {email,password} = req.body;
    try{
        const userExists = await prisma.user.findUnique({
            where: {email}
        });

        if (userExists){
            return res.status(400).json({message:'this email has been registered'});
        }
        const hashedPassword = await bcrypt.hash(password,10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
            },
        });
        res.status(201).json({message:'success',useId:user.id});
    }catch(error){
        console.error(error);
        res.status(500).json({message:'error inside the server'});
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`)
})
const express = require('express')
const User = require('../models/user')
const auth = require('../middleware/auth')
const multer = require("multer")
const sharp = require("sharp")
const {mailSend , cancellationEmail} = require("../email/mail")

const router = new express.Router()

router.post('/users', async (req, res) => {
    const user = new User(req.body)
    mailSend(user.email , user.name)
    try {
        await user.save()
        const token = await user.generateAuthToken()
        res.status(201).send({ user, token })
    } catch (e) {
        res.status(400).send(e)
    }
})

router.post('/users/login', async (req, res) => {
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)
        const token = await user.generateAuthToken()
        res.send({ user, token })
    } catch (e) {
        res.status(400).send()
    }
})

router.post('/users/logout', auth, async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter((token) => {
            return token.token !== req.token
        })
        await req.user.save()

        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.post('/users/logoutAll', auth, async (req, res) => {
    try {
        req.user.tokens = []
        await req.user.save()
        res.send()
    } catch (e) {
        res.status(500).send()
    }
})

router.get('/users/me', auth, async (req, res) => {
    res.send(req.user)
})

router.patch('/users/me', auth ,async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' })
    }

    try {
        const user = await User.findById(req.user._id)

        updates.forEach((update) => user[update] = req.body[update])
        await user.save()

        if (!user) {
            return res.status(404).send()
        }

        res.send(user)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/users/me', auth , async (req, res) => {
    try {
        cancellationEmail(req.user.email , req.user.name)
        await req.user.remove()
        res.send(req.user)
    } catch (e) {
        res.status(500).send(e)
    }
})

const upload = multer({
    limits:{
        fileSize: 1000000
    },
    fileFilter(req , file , cb){
        if(!file.originalname.match(/\.(jpg|jpeg|png)$/)){
            return cb(new Error("Please upload an image"))
        }

        cb(undefined , true)
    }
})

router.post("/users/:id/uploads" ,  auth , upload.single("avatar"), async (req , res)=>{
        const buffer = await sharp(req.file.buffer).resize({height : 250 , width : 250}).png().toBuffer()
        req.user.avatar = buffer
        await req.user.save()
        res.status(200).send("uploaded")
},(error ,req ,res , next)=>{
    res.status(400).send({error: "there is an error"})
})

router.delete("/users/me/avatar" , auth , async (req , res)=>{
    req.user.avatar = undefined
    await req.user.save()
    res.send()
})

router.get("/users/:id/avatar", async (req , res)=>{
    const user = await User.findById(req.params.id)

    if(!user || !user.avatar){
        throw new Error ()
    }

    res.set("Content-Type" , "image/png")
    res.send(user.avatar)

})

module.exports = router
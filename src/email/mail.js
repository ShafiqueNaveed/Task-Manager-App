const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service : "gmail",
    auth:{
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})

const mailSend = (email , name)=>{
    const mailOptions = {
        from: process.env.EMAIL,
        to : email,
        subject : "Greetings",
        text : `Hi there ${name} Thanks for using task manager app`
    }
    transporter.sendMail(mailOptions , (error , info)=>{})
}

const cancellationEmail = (email , name)=>{
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "GoodLuck",
        text: `I hope you enjoy using my app! ${name}`
    }
    transporter.sendMail(mailOptions , (error , info)=>{})
}


module.exports = {
    mailSend,
    cancellationEmail
}
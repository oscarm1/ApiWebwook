const express=require("express");
const body_parser=require("body-parser");
const axios=require("axios");
const https = require('https');
require('dotenv').config();

const app=express().use(body_parser.json());

const token=process.env.TOKEN;
const mytoken=process.env.MYTOKEN;//prasath_token

app.listen(process.env.PORT,()=>{
    console.log("webhook is listening");
});

//to verify the callback url from dashboard side - cloud api side
app.get("/webhook",(req,res)=>{
   let mode=req.query["hub.mode"];
   let challange=req.query["hub.challenge"];
   let token=req.query["hub.verify_token"];


    if(mode && token){

        if(mode==="subscribe" && token===mytoken){
            res.status(200).send(challange);
        }else{
            res.status(403);
        }

    }

});

app.post("/webhook",(req,res)=>{ 

    try{

    let body_param=req.body;

    console.log(JSON.stringify(body_param,null,2));

    if(body_param.object){
        //console.log("inside body param");
        if(body_param.entry && 
            body_param.entry[0].changes && 
            body_param.entry[0].changes[0].value.messages && 
            body_param.entry[0].changes[0].value.messages[0]  
            ){
               let phon_no_id=body_param.entry[0].changes[0].value.metadata.phone_number_id;
               let from = body_param.entry[0].changes[0].value.messages[0].from; 
               let msg_body = body_param.entry[0].changes[0].value.messages[0].text.body;
               let to = process.env.TELTOSEND;

               console.log("phone number "+phon_no_id);
               console.log("from "+from);
               console.log("boady param "+msg_body);

               let data = JSON.stringify(body_param,null,2);

               if(process.env.FLAGTOSEND === "true"){  
                axios({
                    method:"POST",
                    url:"https://graph.facebook.com/v13.0/"+phon_no_id+"/messages?access_token="+token,
                    data:{
                        messaging_product:"whatsapp",
                        to:to,
                        text:{
                            body:"Hi.. your message is "+msg_body
                        }
                    },
                    headers:{
                        "Content-Type":"application/json"
                    }
                });

               }else
               {
                //     console.log("entramos al intento con https://4d27-185-5-48-24.eu.ngrok.io/PostMessages");
                // axios({
                //     method:"POST",
                //     url:"https://4d27-185-5-48-24.eu.ngrok.io/MessagesWP",
                //     data:jsonData,
                //     headers:{
                //         "Content-Type":"application/json"
                //     } 
                // });

                const options = {
                    hostname: process.env.URLLOCAL,
                    path: '/MessagesWP',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': data.length
                    }
                };
                
                
                const req = https.request(options, (res) => {
                    let data = '';
                
                    console.log('Status Code:', res.statusCode);
                
                    res.on('data', (chunk) => {
                        data += chunk;
                    });
                
                    res.on('end', () => {
                        console.log('Body: ', JSON.parse(data));
                    });
                
                }).on("error", (err) => {
                    console.log("Error: ", err.message);
                });
                
                req.write(data);
                req.end();
                }

               res.sendStatus(200);
            }else{
                res.sendStatus(404);
            }

    }
    console.log("hola no entro al emvio del msj");
} catch (err){
    console.log(err);
}

});

app.get("/",(req,res)=>{
    res.status(200).send("hello this is webhook setup");
});
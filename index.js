const express= require("express");
const path=require("path");
const fs=require("fs");
const sharp=require("sharp");
// const pg=require("pg")

// const Client=pg.Client;

// client=new Client({
//     database: "proiect",
//     user: "adrian",
//     password: "oclul",
//     host:"localhost",
//     port:5432
// })

// client.connect()
// client.query("select * from prajituri", function(err, rezultat){
//     console.log(rezultat);
// })

app= express();

app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent", process.cwd());
console.log("Cale fisier", __filename);

obGlobal ={
    obErori: null,
    obImagini: null
}

vectorFoldere=["temp", "poze_uploadate", "backup", "temp1"]
for(let folder of vectorFoldere)
{   
    let folder1=path.join(__dirname, folder);

    if( !fs.existsSync(folder1) )
        fs.mkdirSync(folder1);

}

app.use("/resurse", express.static(path.join(__dirname, "resurse")));

initImagini();

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "resurse/ico/favicon/favicon.ico"));
})

app.get("/*.ejs", function(req, res){
    afisareEroare(res, 400);
})

app.get(["/", "/index", "/home"], function(req, res){
    console.log(req.params);
    res.render("pagini/index", {ip: req.ip, imagini:obGlobal.obImagini.imagini});
})

app.get(/^\/resurse\/[a-z0-9A-Z\/]*\/$/, function(req, res){
    afisareEroare(res, 403);
})

app.get("/*", function(req, res){
    console.log(req.url);
    try{
    res.render("pagini"+req.url, {imagini:obGlobal.obImagini.imagini}, function(err, rezRandare){
        console.log("Eroare", err);
        console.log("Rezultat randare", rezRandare);
        if (err){
            if(err.message.startsWith("Failed to lookup view"))
            {
                afisareEroare(res, 404, "Pagină negăsită", "Verificați bara de adrese!");
            }
            else
            {   
                afisareEroare(res, -1);
            }
        }
        else{
            res.send(rezRandare);
        }
    });
    }
    catch(err1){
        if(err1.message.startsWith("Cannot find module"))
            afisareEroare(res, 404, "Pagină negăsită", "Verificați URL-ul!");
        else
            {   
                afisareEroare(res, -1);
            }
    }
})


function initImagini(){
    var continut= fs.readFileSync(path.join(__dirname,"resurse/json/galerie.json")).toString("utf-8");

    obGlobal.obImagini=JSON.parse(continut);
    
    var d = new Date();
    var hour = d.getHours();
    // hour=13;
    for(let i=0; i< obGlobal.obImagini.imagini.length; i++) 
    {
        elem=obGlobal.obImagini.imagini[i];
        if( hour>=5 && hour<12 )
        {
            if (elem.timp != "dimineata")
                {obGlobal.obImagini.imagini.splice(i, 1);
                    i--;
                }

        }
        if( hour>=12 && hour<20 )
            {
                if (elem.timp != "zi")
                    {obGlobal.obImagini.imagini.splice(i, 1);
                        i--;
                    }
            }
        if( hour<5 || hour>=20 )
            {
                if (elem.timp != "noapte")
                    {obGlobal.obImagini.imagini.splice(i, 1);
                        i--;
                    }
            }
    }

    let vImagini=obGlobal.obImagini.imagini;

    let caleAbs=path.join(__dirname,obGlobal.obImagini.cale_galerie);
    let caleAbsMediu=path.join(__dirname,obGlobal.obImagini.cale_galerie, "mediu");
    if (!fs.existsSync(caleAbsMediu))
        fs.mkdirSync(caleAbsMediu);
    for (let imag of vImagini){
        [numeFis, ext]=imag.cale_relativa.split(".");
        let caleFisAbs=path.join(caleAbs,imag.cale_relativa);
        let caleFisMediuAbs=path.join(caleAbsMediu, numeFis+".webp");
        sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs);
        imag.cale_fisier_mediu=path.join("/", obGlobal.obImagini.cale_galerie, "mediu",numeFis+".webp" )
        imag.cale_relativa=path.join("/", obGlobal.obImagini.cale_galerie, imag.cale_relativa )
        
    }
    console.log(obGlobal.obImagini)
}



function initErori(){
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    console.log(continut)
    obGlobal.obErori=JSON.parse(continut)
    obGlobal.obErori.eroare_default.imagine=path.join(obGlobal.obErori.cale_baza, obGlobal.obErori.eroare_default.imagine)
        for(let eroare of obGlobal.obErori.info_erori){
            eroare.imagine=path.join(obGlobal.obErori.cale_baza, eroare.imagine)
        }
    console.log(obGlobal.obErori)
}

initErori()


function afisareEroare(res, identificator, titlu, text, imagine){
    let eroare= obGlobal.obErori.info_erori.find(function(elem){ return elem.identificator==identificator})
    if(eroare){
        if(eroare.status)
            res.status(identificator)
        var titlu1= titlu || eroare.titlu;
        var text1= text || eroare.text;
        var imagine1= imagine || eroare.imagine;
    }
    else{
        var titlu1= titlu || obGlobal.obErori.eroare_default.titlu;
        var text1= text || obGlobal.obErori.eroare_default.text;
        var imagine1= imagine || obGlobal.obErori.eroare_default.imagine;
    }
    res.render("pagini/eroare", {
        titlu: titlu1,
        text: text1,
        imagine: imagine1
    })
}

app.listen(8080);

// function compileazaScss(caleScss, caleCss){
//         console.log("cale:",caleCss);
//         if(!caleCss){
    
//             let numeFisExt=path.basename(caleScss);
//             let numeFis=numeFisExt.split(".")[0]   /// "a.scss"  -> ["a","scss"]
//             caleCss=numeFis+".css";
//         }
        
//         if (!path.isAbsolute(caleScss))
//             caleScss=path.join(obGlobal.folderScss,caleScss )
//         if (!path.isAbsolute(caleCss))
//             caleCss=path.join(obGlobal.folderCss,caleCss )
        
    
//         let caleBackup=path.join(obGlobal.folderBackup, "resurse/css");
//         if (!fs.existsSync(caleBackup)) {
//             fs.mkdirSync(caleBackup,{recursive:true})
//         }
        
//         // la acest punct avem cai absolute in caleScss si  caleCss
    
//         let numeFisCss=path.basename(caleCss);
//         if (fs.existsSync(caleCss)){
//             fs.copyFileSync(caleCss, path.join(obGlobal.folderBackup, "resurse/css",numeFisCss ))// +(new Date()).getTime()
//         }
//         rez=sass.compile(caleScss, {"sourceMap":true});
//         fs.writeFileSync(caleCss,rez.css)
//         //console.log("Compilare SCSS",rez);
//     }
//     //compileazaScss("a.scss");
//     vFisiere=fs.readdirSync(obGlobal.folderScss);
//     for( let numeFis of vFisiere ){
//         if (path.extname(numeFis)==".scss"){
//             compileazaScss(numeFis);
//         }
//     }
    
    
//     fs.watch(obGlobal.folderScss, function(eveniment, numeFis){
//         console.log(eveniment, numeFis);
//         if (eveniment=="change" || eveniment=="rename"){
//             let caleCompleta=path.join(obGlobal.folderScss, numeFis);
//             if (fs.existsSync(caleCompleta)){
//                 compileazaScss(caleCompleta);
//             }
//         }
//     })    
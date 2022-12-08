//Carregando módulos
const bodyParser = require("body-parser");
const express = require("express");
const app = express();
const db = require('./models/db'); //importando o arquivo db.js
const Usuario = require('./models/Usuario');  //Importando o arquivo Ususario.js
const Grupo = require('./models/Grupo');
const { json } = require("body-parser");
const path = require('path');
const session = require('express-session');
const { Server } = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);



//Configurações
    // Body Parser
app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

    //Express
app.use( express.static("./www"));
//app.use(express.static(path.join(__dirname)));

    //EJS
app.set('view engine', 'ejs'); /*template ejs */
app.set('views', './views');

    //Session
app.use(session({
    secret: '123',
    secure: false,
    resave: false,
    saveUninitialized: false
}));







//Rotas
    //Cadastro
app.post('/cadastrar', async (req, res) => {
    const userBanco = await Usuario.findOne({where: {username: req.body.username}});
    const emailBanco = await Usuario.findOne({where: {email: req.body.email}});
    if((!userBanco) && (!emailBanco)){
        const usuario = await Usuario.create({
            nome_completo: req.body.fullname,
            username: req.body.username,
            email: req.body.email,
            senha: req.body.password
        });    
    
        req.session.usuario = usuario;
        res.redirect('main');
    }else{
        prompt('Erro ao cadastrar! Usuário já existe!');
        res.redirect('cadastrar.html');
    }
})


    //Login na plataforma
app.post('/logar',  async (req, res) => {  /* redireciona para a pagina main */
    const usuario = await Usuario.findOne({where: {username: req.body.username, senha: req.body.password}});
    if (usuario === null){
        console.log('Usuário não encontrado!');
        res.redirect('cadastrar.html');
    }else {
        req.session.usuario = usuario;
        res.redirect('main');
    }
});


//Web Socket
io.on('connection', (socket) => {
    console.log("Entrou!");
})

app.get('/main', async (req, res) => {
    if (req.session.usuario === null) {
        res.redirect('index.html');
    } else {
        const [tamanho, nome] = await buscaGrupos();
        res.render('main', {total: tamanho, nome: nome});
        console.log(req.session.usuario);
    }
});


    //Criação de grupos
app.post("/criar", (req, res) => {     //cria um novo grupo
    Grupo.create({
        nome_grupo: req.body.nomeGrupo
        })
        .then(() => {
            console.log("Grupo criado!");
            res.redirect('main');
        }).catch(() =>{
            return res.status(400).json({
                erro: true,
                mensagem: "Erro: Não foi possível criar grupo..."
            })
        })
    
})

    //Pagina profile
app.get("/profile", async (req, res) => {
    if (req.session.usuario){
        res.render('profile', {name: req.session.usuario.nome_completo, email: req.session.usuario.email, username: req.session.usuario.username});
    }else{
        res.redirect('index.html');
    }
})

app.get('/chat', (req, res) => {
    res.redirect('chat.html');
})


    //Destroy session
app.get('/destroy', (req, res) => {
    req.session.destroy(function(){
        res.render('destroy');
    });
});

app.get('/retornar', (req, res) => {
    res.redirect('index.html');
})


server.listen(3000, ()=>{
    console.log('SERVIDOR RODANDO...\n');
})



//Funções 
async function buscaGrupos(){
    const grupos = await Grupo.findAll();
    strGrupos = JSON.stringify(grupos);
    let jsonGrupos = JSON.parse(strGrupos);
    let nomes = [];

    for (let i = 0; i < jsonGrupos.length; i++){
        nomes.push(jsonGrupos[i].nome_grupo);
    }

    return [jsonGrupos.length, nomes];
}
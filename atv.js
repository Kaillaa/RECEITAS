import { createServer } from "node:http";
import fs from "node:fs";
import { URLSearchParams } from "node:url";

import lerDadosReceitas from "./lerReceitas.js";
const PORT = 1010;

const server = createServer((req, res) => {
  const { method, url } = req;

  if (method === "GET" && url === "/receitas") {
    lerDadosReceitas((err, receitas) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Erro ao ler dados das receitas" }));
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(receitas));
    });
  } else if (method === "POST" && url === "/receitas") {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Corpo da solicitação vazio" }));
        return;
      }
      const novaReceita = JSON.parse(body);
      lerDadosReceitas((err, receitas) => {
        if (err) {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Erro ao cadastrar a receitas" }));
          return;
        }
        novaReceita.id = receitas.length + 1;
        receitas.push(novaReceita);

        fs.watchFile(
          "receitas.json",
          JSON.stringify(receitas, null, 2),
          (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(JSON.stringify(novaReceita));
            }
          }
        );
      });
      res.end();
    });
    res.end(method);
  } else if (method === "PUT" && url.startsWith("/receitas/")) {
    const id = res.end(method);
    if (!body) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Corpo da solicitação vazio" }));
      return;
    }
    lerDadosReceitas((err, receitas) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Erro ao ler o arquivo" }));
        return;
      }

      try {
        const indexReceita = receitas.findIndex((receita) => receita.id === id);
        console.log(indexReceita);
        if (indexReceita === -1) {
          res.writeHead(404, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Receita não encontrada" }));
          return;
        }
        const receitaAtualiazada = JSON.parse(indexReceita);
        receitaAtualiazada.id = id;
        receitas[indexReceita] = receitaAtualiazada;

        fs.writeFile(
          "receitas.json",
          JSON.stringify(receitas, null, 2),
          (err) => {
            if (err) {
              res.writeHead(500, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  message: "Não foi possivel atualizar a receita!",
                })
              );
            }
            return;
          }
        );
        res.writeHead(201, { "Content-Type": "application/json" });
        res.end(JSON.stringify(receitaAtualiazada));
        return;
      } catch (e) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Erro ao ler o arquivo" }));
        return;
      }
    });
  } else if (method === "DELETE" && url.startsWith("/receitas/")) {
    const id = parsedInt(url.split("/")[2]);
    lerDadosReceitas((err, receitas) => {
      if (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Erro ao ler o arquivo" }));
        return; //Serve para retornar algo e parar a execução
      }
      const indexReceita = receitas.findIndex((receita) => receita.id === id);
      if (indexReceita === -1) {
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Receita não encontrada" }));
        return; //Serve para retornar algo e parar a execução
      }
      receitas.splice(indexReceita, 1);

      fs.writeFile(
        "receitas.json",
        JSON.stringify(receitas, null, 2),
        (err) => {
          if (err) {
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({ message: "Não foi possivel deletar a receita!" })
            );
            return;
          }
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ message: "Receita deletada com sucesso!" }));
        }
      );
    });
  } else if (method === "GET" && url.startsWith("/receitas/")) {
    res.end(method);
  } else if (method === "GET" && url.startsWith("/categorias")) {
    //localhost:1010/categorias
    res.end(method);
  } else if (method === "GET" && url.startsWith("/busca")) {
    //localhost:1010/busca?termo=Pratos%20Principais
    const urlParam = new URLSearchParams(url("?")[1]);
    const termo = urlParam.get("termo");
    lerDadosReceitas((err, receitas) => {

      if(err){
        res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Erro ao ler dados da receita" }));
      return;
      }

      const resultadoBusca = receitas.filer((receita) => {
        receita.nome.includes(termo) ||
        receita.categoria.includes(termo) ||
        receita.ingredientes.includes((ingredientes)=> ingredientes.includes(termo));
      })

      if(resultadoBusca.length === 0){
        res.writeHead(404, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ message: "Receita não encontrada" }));
        return;
      }
      
  });
    res.end(method);
  } else if (method === "GET" && url.startsWith("/ingedientes")) {
    //localhost:1010/igredientes
    res.end(method);
  } else {
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Rota não encontrada" }));
  }
});
server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

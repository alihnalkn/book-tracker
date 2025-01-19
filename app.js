import express from "express";
import pg from "pg";
import axios from "axios";
import bodyParser from "body-parser";

const port = 3000;
const app = express();

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "book_tracker",
    password: "Password",
    port: 5432,
});
db.connect();

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

app.get("/books", async(req,res) => {
    const { sort } = req.query;
    const order = sort === 'rating' ? 'rating DESC' : sort === 'title' ? 'title ASC' : 'date_read DESC';
    try {
        const result = await db.query(`SELECT * FROM books ORDER BY ${order}`);
        res.render("list.ejs", {books: result.rows})
    } catch(err) {
        console.error(err);
        res.status(500).send("Error retrieving books");
    }
});

app.post("/books", async(req,res) => {
    const { title, author, notes, rating, date_read} = req.body;
    try {
        const coverResponse = await axios.get(`http://covers.openlibrary.org/b/title/${title}-L.jpg`);
        const coverUrl = coverResponse.request.res.responseUrl;
        await db.query(
            "INSERT INTO books (title, author, notes, rating, date_read, cover_url) VALUES ($1, $2, $3, $4, $5, $6)",
            [title, author, notes, rating, date_read, coverUrl]
        );
        res.redirect("/books");
    } catch(err) {
        console.error(err);
        res.status(500).send("Error adding book");
    }
});

app.post("/books/:id/edit", async(req,res) => {
    const {id} = req.params;
    const { title, author, notes, rating, date_read} = req.body;
    try {
        await db.query("UPDATE books SET title=$1, author=$2, notes=$3, rating=$4, date_read=$5 WHERE id=$6",
        [title,author, notes, rating, date_read, id]    
        );
        res.redirect("/books")
    } catch(err) {
        console.error(err);
        res.status(500).send("Error editing book");
    }
});

app.post("/books/:id/delete", async(req,res) => {
    const {id} = req.params;
    try {
        await db.query("DELETE FROM books WHERE id=$1", [id]);
        res.redirect("/books");
    } catch(err) {
        console.error(err);
        res.status(500).send("Error deleting book");
    }
})

app.get("/books/add", (req,res) => {
    res.render("add.ejs")
});

app.listen(port, () => {
    console.log(`Server running in port ${port}`)
});

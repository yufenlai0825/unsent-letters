// The Password is AddressToTheFire

import express from "express"; 
import fs from "fs";
import axios from "axios"; 

const app = express();
const port = 3000;
const postsFilePath = "./posts.json";

//Middleware
app.use(express.static("public")); // Serve static files from the "public" directory
app.use("/bootstrap-icons", // Map this path to serve icons
express.static("node_modules/bootstrap-icons/font"));
app.use(express.urlencoded ({extended: true})) ; //form data being parsed into req.body
app.use(express.json()); // Enable JSON parsing

// Get posts from JSON file
function getPosts() {
    const data = fs.readFileSync(postsFilePath, "utf8"); //returns a RAW string (that looks like array) 
    const posts= JSON.parse (data); //convert data to an array
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));  
    return posts ;
}; 

// Save posts to JSON file
function savePosts(posts) {
  const data = JSON.stringify(posts, null, 2); 
  //default behavior (when null): Include all properties of the object in the output.
  fs.writeFileSync(postsFilePath, data, "utf8");
  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
}; 

//Login
app.get("/", (req, res) => {
  res.render("index.ejs");  
});

app.post("/main", (req, res) => {
    if (req.body.password === "AddressToTheFire") {
        const posts = getPosts(); //load posts from the JSON file
        res.render("main.ejs",  { posts });
    } else {
        res.redirect("/?error=true"); 
    }
});

// Display blog posts on Main Page
app.get("/main", (req, res) => {
    const posts = getPosts(); //Always fetch latest posts
    res.render("main.ejs", { posts });
});
  
// Draft a new post
app.get("/draft", (req, res) => { ////showing the form where users enter a title, author name, and content for their new post
    res.render("draft.ejs");
  });
  
app.post("/draft", (req, res) => { //draft page handles the form submission
  const posts = getPosts();  
  const { title, author, content } = req.body;
    const newPost = {
      ...req.body, //alternatively use spread syntax ...req.body
      date: new Date().toUTCString(),
    };
    //extracts the values from the form and assigns them to the respective variables
    posts.push(newPost);
    savePosts(posts);
    console.log("New post created:", newPost);

    res.redirect("/main");
  });

// Edit a post
app.get("/edit", (req, res) => {
    const posts = getPosts();
    const { title } = req.query; //get title from URL query parameters
    // extract the title from the query parameters and find the post before rendering edit.ejs.

    //find the post in the posts by title
    function isTitle (targetedPost) {
        return targetedPost.title === title; 
    }
    const post = posts.find(isTitle); //returns the first element that satisfies the testing function

    if (!post) {
        return res.redirect("/main"); // If post doesn't exist, go back to main page
    }

    res.render("edit.ejs", { post }); // Pass the data of post I want to edit to edit.ejs
}); 
  
app.post("/edit", (req, res) => {
  const posts = getPosts();  
  const { originalTitle, title, author, content } = req.body;
    
    // Find the post by its original title
    const postIndex = posts.findIndex((post) => post.title === originalTitle);
    if (postIndex === -1) {
    return res.redirect("/main"); // If post not found, go back to main
    }
    // Update post with new values
    posts[postIndex] = {
    title,
    author,
    content,
    date: new Date().toUTCString(),
    };

    savePosts(posts);
    console.log("Post edited:", posts[postIndex]);
  
    res.redirect("/main");

  });  

//Delete a post 
app.post("/delete", (req, res) => {
    const posts = getPosts();
    let { title } = req.body; 
    const postIndex = posts.findIndex((post) => post.title === title); // Find the post index
    if (postIndex !== -1) {
    posts.splice(postIndex, 1); // If post found, removed 
    } else {
    console.log("Post not found."); 
    }
    savePosts(posts);
    res.redirect("/main");
}); 

// Get the lyrics
app.get("/lyrics", (req, res) => {
  res.render("lyrics.ejs", { songtitle: null, content: null });
});

app.post("/get-lyrics", async (req, res) => {
  const searchSong = req.body.title;
  try {
    const result = await axios.get("https://api.lyrics.ovh/v1/Taylor-Swift/" + searchSong);
    res.render("lyrics.ejs", { songtitle: searchSong, content: result.data.lyrics });
  } catch (error) {
    console.log(error.response.data);
    res.status(500);
  }
});

app.listen(port, () => {
  console.log(`Listening on port ${port}`);
});
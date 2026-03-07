import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import movies from "./models/movies.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// Main page - redirect to movies
app.get("/", (req, res) => {
  res.redirect("/movies");
});

// List all movies
app.get("/movies", (req, res) => {
  const allMovies = movies.getAll();
  res.render("movies", {
    title: "My Favorite Movies",
    movies: allMovies,
  });
});

// Show new movie form (MUST come before /:movie_id route)
app.get("/movies/new", (req, res) => {
  res.render("new_movie", {
    title: "Add New Movie",
    movie: null,
    errors: [],
  });
});

// Show single movie
app.get("/movies/:movie_id", (req, res) => {
  const movie = movies.getById(parseInt(req.params.movie_id, 10));
  if (movie) {
    res.render("movie", {
      title: movie.title,
      movie,
      errors: [],
    });
  } else {
    res.sendStatus(404);
  }
});

// Add new movie
app.post("/movies", (req, res) => {
  const movie_data = {
    title: req.body.title,
    director: req.body.director,
    year:
      req.body.year !== undefined && req.body.year !== ""
        ? parseInt(req.body.year, 10)
        : undefined,
    genre: req.body.genre || undefined,
    rating:
      req.body.rating !== undefined && req.body.rating !== ""
        ? parseFloat(req.body.rating)
        : undefined,
  };

  const errors = movies.validateMovieData(movie_data);
  if (errors.length === 0) {
    movies.add(movie_data);
    res.redirect("/movies");
  } else {
    res.status(400);
    res.render("new_movie", {
      title: "Add New Movie",
      movie: movie_data,
      errors,
    });
  }
});

// Show edit movie form
app.get("/movies/:movie_id/edit", (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const movie = movies.getById(movie_id);
  if (!movie) {
    res.sendStatus(404);
    return;
  }
  res.render("edit_movie", {
    title: `Edit Movie - ${movie.title}`,
    movie,
    errors: [],
  });
});

// Update movie
app.post("/movies/:movie_id/edit", (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const movie = movies.getById(movie_id);
  if (!movie) {
    res.sendStatus(404);
    return;
  }

  const movie_data = {
    title: req.body.title,
    director: req.body.director,
    year:
      req.body.year !== undefined && req.body.year !== ""
        ? parseInt(req.body.year, 10)
        : undefined,
    genre: req.body.genre || undefined,
    rating:
      req.body.rating !== undefined && req.body.rating !== ""
        ? parseFloat(req.body.rating)
        : undefined,
  };

  const errors = movies.validateMovieData(movie_data);
  if (errors.length === 0) {
    movies.update(movie_id, movie_data);
    res.redirect(`/movies/${movie_id}`);
  } else {
    res.status(400);
    res.render("edit_movie", {
      title: `Edit Movie - ${req.body.title}`,
      movie: { id: movie_id, ...movie_data },
      errors,
    });
  }
});

// Delete movie
app.post("/movies/:movie_id/delete", (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const success = movies.delete(movie_id);
  if (success) {
    res.redirect("/movies");
  } else {
    res.sendStatus(404);
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
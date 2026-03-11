import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import morgan from "morgan";
import session from "express-session";
import movies from "./models/movies.js";
import users from "./models/users.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = 8000;

const app = express();
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use(
  session({
    secret: "movie-app-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

function requireAuth(req, res, next) {
  if (!req.session.user) {
    res.redirect("/login");
    return;
  }
  next();
}

// Main page - redirect to movies
app.get("/", (req, res) => {
  res.redirect("/movies");
});

// Seed test data
app.get("/movies/seed", requireAuth, (req, res) => {
  movies.seedData();
  res.redirect("/movies");
});

// List all movies
app.get("/movies", requireAuth, (req, res) => {
  let allMovies = movies.getAllForUser(req.session.user.id);
  const user = users.getById(req.session.user.id);
  if (!user.hasSeenSampleMovies && allMovies.length === 0) {
    movies.seedData();
    allMovies = movies.getAllForUser(req.session.user.id);
    users.markSeenSampleMovies(req.session.user.id);
  }
  res.render("movies", {
    title: "My Favorite Movies",
    movies: allMovies,
  });
});

// Show new movie form (MUST come before /:movie_id route)
app.get("/movies/new", requireAuth, (req, res) => {
  res.render("new_movie", {
    title: "Add New Movie",
    movie: null,
    errors: [],
  });
});

// Show single movie
app.get("/movies/:movie_id", requireAuth, (req, res) => {
  const movie = movies.getById(parseInt(req.params.movie_id, 10));
  if (movie && (movie.userId === null || movie.userId === req.session.user.id)) {
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
app.post("/movies", requireAuth, (req, res) => {
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
    movies.add(movie_data, req.session.user.id);
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
app.get("/movies/:movie_id/edit", requireAuth, (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const movie = movies.getById(movie_id);
  if (!movie || (movie.userId !== null && movie.userId !== req.session.user.id)) {
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
app.post("/movies/:movie_id/edit", requireAuth, (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const movie = movies.getById(movie_id);
  if (!movie || (movie.userId !== null && movie.userId !== req.session.user.id)) {
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
    const updated = movies.update(movie_id, movie_data, req.session.user.id);
    res.redirect(`/movies/${updated.id}`);
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
app.post("/movies/:movie_id/delete", requireAuth, (req, res) => {
  const movie_id = parseInt(req.params.movie_id, 10);
  const movie = movies.getById(movie_id);
  if (!movie || (movie.userId !== null && movie.userId !== req.session.user.id)) {
    res.sendStatus(404);
    return;
  }
  const success = movies.delete(movie_id, req.session.user.id);
  if (success) {
    res.redirect("/movies");
  } else {
    res.sendStatus(404);
  }
});

// Show register form
app.get("/register", (req, res) => {
  if (req.session.user) {
    res.redirect("/movies");
    return;
  }
  res.render("register", {
    title: "Register",
    error: null,
  });
});

// Handle registration
app.post("/register", async (req, res) => {
  if (req.session.user) {
    res.redirect("/movies");
    return;
  }

  const result = await users.create({
    username: req.body.username,
    password: req.body.password,
  });

  if (result.error) {
    res.render("register", {
      title: "Register",
      error: result.error,
    });
    return;
  }

  req.session.user = {
    id: result.user.id,
    username: result.user.username,
  };
  res.redirect("/movies");
});

// Show login form
app.get("/login", (req, res) => {
  if (req.session.user) {
    res.redirect("/movies");
    return;
  }
  res.render("login", {
    title: "Login",
    error: null,
  });
});

// Handle login
app.post("/login", async (req, res) => {
  if (req.session.user) {
    res.redirect("/movies");
    return;
  }

  const user = await users.validatePassword(
    req.body.username,
    req.body.password
  );

  if (!user) {
    res.render("login", {
      title: "Login",
      error: "Invalid username or password",
    });
    return;
  }

  req.session.user = {
    id: user.id,
    username: user.username,
  };
  res.redirect("/movies");
});

// Handle logout
app.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
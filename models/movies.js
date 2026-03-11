import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataFilePath = path.join(__dirname, "..", "data", "movies.json");

let movies = [];
let id = 1;

const sample_categories = {
  "sci-fi": {
    name: "Sci-Fi",
    movies: [
      {
        title: "Inception",
        director: "Christopher Nolan",
        year: 2010,
        rating: 10.0,
      },
      {
        title: "Blade Runner 2049",
        director: "Denis Villeneuve",
        year: 2017,
        rating: 8.0,
      },
    ],
  },
  "drama": {
    name: "Drama",
    movies: [
      {
        title: "The Shawshank Redemption",
        director: "Frank Darabont",
        year: 1994,
        rating: 9.3,
      },
      {
        title: "Forrest Gump",
        director: "Robert Zemeckis",
        year: 1994,
        rating: 8.8,
      },
    ],
  },
  "crime": {
    name: "Crime",
    movies: [
      {
        title: "Pulp Fiction",
        director: "Quentin Tarantino",
        year: 1994,
        rating: 8.9,
      },
    ],
  },
  "action": {
    name: "Action",
    movies: [
      {
        title: "The Dark Knight",
        director: "Christopher Nolan",
        year: 2008,
        rating: 9.0,
      },
    ],
  },
};

function seedData() {
  let movieId = 1;
  movies = [];

  for (const category of Object.values(sample_categories)) {
    for (const m of category.movies) {
      movies.push({
        id: movieId++,
        title: m.title,
        director: m.director,
        year: m.year,
        genre: category.name,
        rating: m.rating,
        userId: null,
      });
    }
  }

  id = movies.length + 1;
  saveMovies();
  return movies;
}

function saveMovies() {
  fs.writeFileSync(dataFilePath, JSON.stringify({ movies, nextId: id }, null, 2));
}

function loadMovies() {
  try {
    if (fs.existsSync(dataFilePath)) {
      const data = fs.readFileSync(dataFilePath, "utf-8");
      const parsed = JSON.parse(data);
      movies = parsed.movies || [];
      id = parsed.nextId || 1;
    }
  } catch (err) {
    movies = [];
    id = 1;
  }
}

loadMovies();

class Movie {
  constructor(title, director, year, genre, rating, userId) {
    this.id = id++;
    this.title = title;
    this.director = director;
    this.year = year;
    this.genre = genre || "";
    this.rating = rating || 0;
    this.userId = userId;
  }
}

export function add(movie_data, userId) {
  const movie = new Movie(movie_data.title, movie_data.director, movie_data.year, movie_data.genre, movie_data.rating, userId);
  movies.push(movie);
  saveMovies();
  return movie;
}

export function getAll() {
  return movies;
}

export function getAllForUser(userId) {
  return movies.filter(m => (m.userId === null || m.userId === userId) && (!m.hiddenFor || !m.hiddenFor.includes(userId)));
}

export function getById(id_param) {
  return movies.find(m => m.id === id_param);
}

export function update(id_param, movie_data, userId) {
  let movie = movies.find(m => m.id === id_param);
  if (!movie) return null;

  if (movie.userId === null) {
    movie = new Movie(movie_data.title, movie_data.director, movie_data.year, movie_data.genre, movie_data.rating, userId);
    movies.push(movie);
  } else if (movie.userId !== userId) {
    return null;
  } else {
    movie.title = movie_data.title;
    movie.director = movie_data.director;
    movie.year = movie_data.year;
    movie.genre = movie_data.genre;
    movie.rating = movie_data.rating;
  }
  saveMovies();
  return movie;
}

export function deleteMovie(id_param, userId) {
  const movie = movies.find(m => m.id === id_param);
  if (!movie) return false;

  if (movie.userId === null) {
    if (!movie.hiddenFor) movie.hiddenFor = [];
    if (!movie.hiddenFor.includes(userId)) {
      movie.hiddenFor.push(userId);
    }
  } else if (movie.userId !== userId) {
    return false;
  } else {
    movies = movies.filter(m => m.id !== id_param);
  }
  saveMovies();
  return true;
}

export function validateMovieData(movie) {
  const errors = [];

  if (!movie || typeof movie !== "object") {
    errors.push("Invalid movie data");
    return errors;
  }

  if (!movie.title || typeof movie.title !== "string" || movie.title.trim() === "") {
    errors.push("Title is required");
  }

  if (!movie.director || typeof movie.director !== "string" || movie.director.trim() === "") {
    errors.push("Director is required");
  }

  if (movie.year !== undefined && movie.year !== null) {
    if (typeof movie.year !== "number" || movie.year < 1800 || movie.year > new Date().getFullYear() + 5) {
      errors.push("Year must be a valid number between 1800 and next year");
    }
  }

  if (movie.rating !== undefined && movie.rating !== null) {
    if (typeof movie.rating !== "number" || movie.rating < 0 || movie.rating > 10) {
      errors.push("Rating must be between 0 and 10");
    }
  }

  return errors;
}

export { sample_categories };

export default {
  add,
  getAll,
  getAllForUser,
  getById,
  update,
  delete: deleteMovie,
  validateMovieData,
  seedData,
  sample_categories
};
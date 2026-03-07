let movies = [];
let id = 1;

class Movie {
  constructor(title, director, year, genre, rating) {
    this.id = id++;
    this.title = title;
    this.director = director;
    this.year = year;
    this.genre = genre || "";
    this.rating = rating || 0;
  }
}

export function add(movie_data) {
  const movie = new Movie(movie_data.title, movie_data.director, movie_data.year, movie_data.genre, movie_data.rating);
  movies.push(movie);
  return movie;
}

export function getAll() {
  return movies;
}

export function getById(id_param) {
  return movies.find(m => m.id === id_param);
}

export function update(id_param, movie_data) {
  const movie = movies.find(m => m.id === id_param);
  if (movie) {
    movie.title = movie_data.title;
    movie.director = movie_data.director;
    movie.year = movie_data.year;
    movie.genre = movie_data.genre;
    movie.rating = movie_data.rating;
  }
  return movie;
}

export function deleteMovie(id_param) {
  movies = movies.filter(m => m.id !== id_param);
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

export default {
  add,
  getAll,
  getById,
  update,
  delete: deleteMovie,
  validateMovieData
};
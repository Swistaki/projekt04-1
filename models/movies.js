import db_ops from "./database.js";

const sample_categories = {
  "sci-fi": {
    name: "Sci-Fi",
    movies: [
      { title: "Inception", director: "Christopher Nolan", year: 2010, rating: 10.0 },
      { title: "Blade Runner 2049", director: "Denis Villeneuve", year: 2017, rating: 8.0 },
    ],
  },
  "drama": {
    name: "Drama",
    movies: [
      { title: "The Shawshank Redemption", director: "Frank Darabont", year: 1994, rating: 9.3 },
      { title: "Forrest Gump", director: "Robert Zemeckis", year: 1994, rating: 8.8 },
    ],
  },
  "crime": {
    name: "Crime",
    movies: [
      { title: "Pulp Fiction", director: "Quentin Tarantino", year: 1994, rating: 8.9 },
    ],
  },
  "action": {
    name: "Action",
    movies: [
      { title: "The Dark Knight", director: "Christopher Nolan", year: 2008, rating: 9.0 },
    ],
  },
};

function parseMovie(row) {
  return {
    ...row,
    hiddenFor: row.hiddenFor ? JSON.parse(row.hiddenFor) : null,
  };
}

function seedData() {
  const existing = db_ops.get_all_movies.all();
  if (existing.length > 0) return;

  for (const category of Object.values(sample_categories)) {
    for (const m of category.movies) {
      db_ops.insert_movie.run(m.title, m.director, m.year, category.name, m.rating, null);
    }
  }

  return getAll();
}

export function add(movie_data, userId) {
  const result = db_ops.insert_movie.run(
    movie_data.title,
    movie_data.director,
    movie_data.year,
    movie_data.genre || null,
    movie_data.rating || null,
    userId
  );
  return parseMovie(result);
}

export function getAll() {
  return db_ops.get_all_movies.all().map(parseMovie);
}

export function getAllForUser(userId) {
  return db_ops.get_movies_for_user
    .all(userId)
    .map(parseMovie)
    .filter(m => !m.hiddenFor || !m.hiddenFor.includes(userId));
}

export function getById(id_param) {
  const row = db_ops.get_movie_by_id.get(id_param);
  return row ? parseMovie(row) : null;
}

export function update(id_param, movie_data, userId) {
  const movie = getById(id_param);
  if (!movie) return null;

  if (movie.userId === null) {
    const result = db_ops.insert_movie.run(
      movie_data.title,
      movie_data.director,
      movie_data.year,
      movie_data.genre || null,
      movie_data.rating || null,
      userId
    );
    return parseMovie(result);
  } else if (movie.userId !== userId) {
    return null;
  } else {
    const result = db_ops.update_movie.run(
      movie_data.title,
      movie_data.director,
      movie_data.year,
      movie_data.genre || null,
      movie_data.rating || null,
      movie.userId,
      id_param
    );
    return result ? parseMovie(result) : null;
  }
}

export function deleteMovie(id_param, userId) {
  const movie = getById(id_param);
  if (!movie) return false;

  if (movie.userId === null) {
    const hiddenFor = movie.hiddenFor || [];
    if (!hiddenFor.includes(userId)) {
      hiddenFor.push(userId);
    }
    db_ops.update_movie_hidden.run(JSON.stringify(hiddenFor), id_param);
  } else if (movie.userId !== userId) {
    return false;
  } else {
    db_ops.delete_movie.run(id_param);
  }
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
  sample_categories,
};

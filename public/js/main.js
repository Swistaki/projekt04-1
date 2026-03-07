document.addEventListener('DOMContentLoaded', () => {
    const movieForm = document.getElementById('movie-form');
    const movieList = document.getElementById('movie-list');

    movieForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const director = document.getElementById('director').value;
        const year = document.getElementById('year').value;

        const response = await fetch('/movies', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title, director, year }),
        });

        if (response.ok) {
            const newMovie = await response.json();
            addMovieToList(newMovie);
            movieForm.reset();
        } else {
            console.error('Error adding movie:', response.statusText);
        }
    });

    function addMovieToList(movie) {
        const li = document.createElement('li');
        li.textContent = `${movie.title} directed by ${movie.director} (${movie.year})`;
        movieList.appendChild(li);
    }
});
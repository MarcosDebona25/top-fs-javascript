Source: https://sqlbolt.com/

### Lesson 1
- SELECT title FROM movies;
- SELECT director FROM movies;
- SELECT title, director FROM movies;
- SELECT title, year FROM movies;
- SELECT * FROM movies;

### Lesson 2
- SELECT * FROM movies WHERE id = 6;
- SELECT * FROM movies WHERE year BETWEEN 2000 AND 2010;
- SELECT * FROM movies WHERE year NOT BETWEEEN 2000 AND 2010;
- SELECT * FROM movies ORDER BY year ASC LIMIT 5;

### Lesson 3
- SELECT * FROM movies WHERE title LIKE 'Toy Story%';
- SELECT * FROM movies WHERE director = 'John Lasseter';
- SELECT * FROM movies WHERE director != 'John Lasseter';
- SELECT * FROM movies WHERE title LIKE 'WALL%'

### Lesson 4
- SELECT DISTINCT director FROM movies ORDER BY director ASC;
- SELECT * FROM movies ORDER BY year DESC LIMIT 4;
- SELECT * FROM movies ORDER BY title ASC LIMIT 5;
- SELECT * FROM movies ORDER BY title ASC LIMIT 5 OFFSET 5;

### Lesson 5
- SELECT city, population FROM north_american_cities WHERE country = "Canada";
- SELECT * FROM north_american_cities WHERE country = "United States" ORDER BY latitude DESC;
- SELECT city, longitude FROM north_american_cities WHERE longitude < -87.629798 ORDER BY longitude ASC;
- SELECT * FROM north_american_cities WHERE country = 'Mexico' ORDER BY population DESC LIMIT 2;
- SELECT * FROM north_american_cities WHERE country = 'United States' ORDER BY population DESC LIMIT 2 OFFSET 2;

### Lesson 6 
- SELECT domestic_sales, international_sales, movies.title FROM boxoffice JOIN movies ON boxoffice.movie_id = movies.id;
- SELECT boxoffice.domestic_sales, boxoffice.international_sales, movies.title FROM boxoffice JOIN movies ON boxoffice.movie_id = movies.id WHERE boxoffice.domestic_sales < boxoffice.international_sales;
- SELECT * FROM movies JOIN boxoffice ON movies.id = boxoffice.movie_id ORDER BY rating DESC;

### Lesson 7
- SELECT DISTINCT building FROM employees;
- SELECT * FROM buildings;
- SELECT DISTINCT buildings.building_name, employees.role FROM buildings LEFT JOIN employees ON buildings.building_name = employees.building

### Lesson 8
- SELECT * FROM employees WHERE building IS NULL;
- SELECT building_name FROM buildings WHERE building_name NOT IN (SELECT DISTINCT building_name FROM buildings JOIN employees ON buildings.building_name = employees.building)

### Lesson 9
- SELECT (SUM(boxoffice.domestic_sales) + SUM(boxoffice.international_sales)) / 1000000 as total, boxoffice.movie_id FROM boxoffice GROUP BY boxoffice.movie_id;
- SELECT *, boxoffice.rating * 10 FROM movies JOIN boxoffice ON movies.id = boxoffice.movie_id;
- SELECT * FROM movies WHERE Year % 2 == 0;

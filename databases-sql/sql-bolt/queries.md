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

### Lesson 10
- SELECT MAX(years_employed) FROM employees;
- SELECT AVG(years_employed), role FROM employees GROUP BY role;
- SELECT SUM(years_employed), building FROM employees GROUP BY building;

### Lesson 11
- SELECT COUNT(role) FROM employees WHERE role = 'Artist';
- SELECT COUNT(*), role FROM employees GROUP BY role;
- SELECT SUM(years_employed) FROM employees GROUP BY role HAVING role = 'Engineer'; // SELECT SUM(years_employed) FROM employees WHERE role = 'Engineer';

### Lesson 12
- SELECT COUNT(title) as movies_per_director, director FROM movies GROUP BY director;
- SELECT SUM(boxoffice.domestic_sales + boxoffice.international_sales) as sales_per_director, movies.director FROM movies JOIN boxoffice ON movies.id = boxoffice.movie_id
GROUP BY movies.director

### Lesson 13
- INSERT INTO movies (title, director, year, length_minutes) VALUES ('Toy Story 4', 'Unknown', 2000, 150);
- INSERT INTO boxoffice (movie_id, rating, domestic_sales, international_sales) VALUES (15, 8.7, 340000000, 270000000);

### Lesson 14
- UPDATE movies SET director = 'John Lasseter' WHERE title = "A Bug's Life";
- UPDATE movies SET year = 1999 WHERE title = 'Toy Story 2';
- UPDATE movies SET title = 'Toy Story 3', director = 'Lee Unkrich' WHERE id = 11;

### Lesson 15
- DELETE * FROM movies WHERE year < 2005;
- DELETE FROM movies WHERE director = 'Andrew Stanton';

### Lesson 16
- CREATE TABLE IF NOT EXISTS database (
    name TEXT,
    version FLOAT,
    download_count INTEGER
)

### Lesson 17
- ALTER TABLE movies ADD COLUMN aspect_ratio FLOAT;
- ALTER TABLE movies ADD COLUMN Language TEXT DEFAULT 'English';

### Lesson 18
- DROP TABLE IF EXISTS movies;
- DROP TABLE IF EXISTS boxoffice;
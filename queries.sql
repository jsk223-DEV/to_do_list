CREATE TABLE users(
    id SERIAL NOT NULL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100)
)

CREATE TABLE sections (
    id SERIAL NOT NULL PRIMARY KEY,
    user_id INT REFERENCES users(id)
    title VARCHAR(100),
    color VARCHAR(30),
    selected BOOLEAN,
    order_num INT 
);

CREATE TABLE todos (
    id SERIAL NOT NULL PRIMARY KEY,
    section_id INT REFERENCES sections(id),
    completed BOOLEAN,
    title VARCHAR(100),
    order_num INT
);

CREATE TABLE sections (
    id SERIAL NOT NULL PRIMARY KEY,
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
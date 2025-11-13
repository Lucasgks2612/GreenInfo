create database greenInfo;
use greenInfo;

create table users(
	id INT AUTO_INCREMENT PRIMARY KEY,
	name varchar(255),
    email varchar(255),
    password varchar(255),
    profile_picture varchar(500),
    bio varchar(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

create table news(
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    title varchar(255),
    content varchar(500),
    img varchar(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
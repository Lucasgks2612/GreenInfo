create database greenInfo;
use greenInfo;

create table users(
	id INT AUTO_INCREMENT PRIMARY KEY,
	name varchar(255),
    email varchar(255),
    password varchar(255)
);

create table news(
    id INT AUTO_INCREMENT PRIMARY KEY,
    title varchar(255),
    content varchar(255),
    img --nao sei como salva--
);
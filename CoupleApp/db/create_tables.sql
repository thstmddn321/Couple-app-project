CREATE DATABASE IF NOT EXISTS couple_app;
USE couple_app;

-- Table: member
CREATE TABLE member (
    member_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50),
    email VARCHAR(50) UNIQUE,
    password VARCHAR(100),
    sex ENUM('M', 'F'),
    sharing TINYINT
);

-- Table: couple
CREATE TABLE couple (
    couple_id INT AUTO_INCREMENT PRIMARY KEY,
    male_id INT,
    female_id INT,
    couple_date DATE,
    total_distance DOUBLE,
    coins INT,
    share_location TINYINT
);

-- Table: couple_visit
CREATE TABLE couple_visit (
    visit_id INT AUTO_INCREMENT PRIMARY KEY,
    couple_id INT,
    visit_date DATE,
    latitude DOUBLE,
    longitude DOUBLE,
    stayed_seconds INT,
    distance DOUBLE
);

-- Table: location_log
CREATE TABLE location_log (
    log_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    latitude DOUBLE,
    longitude DOUBLE,
    timestamp DATETIME
);

-- Table: member_pet
CREATE TABLE member_pet (
    member_id INT PRIMARY KEY,
    equipped_carpet VARCHAR(50),
    equipped_house VARCHAR(50)
);

-- Table: pet_item_inventory
CREATE TABLE pet_item_inventory (
    inventory_id INT AUTO_INCREMENT PRIMARY KEY,
    member_id INT,
    item_id INT
);

-- Table: shop_items
CREATE TABLE shop_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    item_name VARCHAR(50),
    category ENUM('carpet', 'house'),
    price INT
);
-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 17, 2025 at 08:17 AM
-- Server version: 9.1.0
-- PHP Version: 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bidops`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`admin_id`, `username`, `password`) VALUES
('A1', 'superadmin', 'adminpass');

-- --------------------------------------------------------

--
-- Table structure for table `biditem`
--

DROP TABLE IF EXISTS `biditem`;
CREATE TABLE IF NOT EXISTS `biditem` (
  `item_id` int NOT NULL,
  `starting_price` decimal(10,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `bid_increment_percent` decimal(5,2) DEFAULT '0.00',
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `bidoffer`
--

DROP TABLE IF EXISTS `bidoffer`;
CREATE TABLE IF NOT EXISTS `bidoffer` (
  `bid_id` int NOT NULL AUTO_INCREMENT,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_status` enum('active','won','lost','pending','retracted') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `bidder_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`bid_id`),
  KEY `fk_bidoffer_item` (`item_id`),
  KEY `fk_bidoffer_bidder` (`bidder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
CREATE TABLE IF NOT EXISTS `chat` (
  `chat_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `seller_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `buyer_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`chat_id`),
  KEY `fk_chat_seller` (`seller_id`),
  KEY `fk_chat_buyer` (`buyer_id`),
  KEY `fk_chat_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=411 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
CREATE TABLE IF NOT EXISTS `item` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `description` text COLLATE utf8mb4_general_ci,
  `category_type` varchar(50) COLLATE utf8mb4_general_ci DEFAULT NULL,
  `status` enum('pending_approval','approval_rejected','active','sold') COLLATE utf8mb4_general_ci DEFAULT 'pending_approval',
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_type` enum('bid','swap') COLLATE utf8mb4_general_ci NOT NULL,
  `seller_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_item_seller` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `itemimage`
--

DROP TABLE IF EXISTS `itemimage`;
CREATE TABLE IF NOT EXISTS `itemimage` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_itemimage_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=439 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
CREATE TABLE IF NOT EXISTS `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `message` text COLLATE utf8mb4_general_ci NOT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `chat_id` int NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `fk_message_chat` (`chat_id`),
  KEY `fk_message_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=518 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `notif_id` int NOT NULL AUTO_INCREMENT,
  `type` enum('bid_won','bid_accepted','swap_accepted','swap_rejected','listing_approved','listing_rejected','message','report_result','item_cancelled') COLLATE utf8mb4_general_ci NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `message` text COLLATE utf8mb4_general_ci,
  `user_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  PRIMARY KEY (`notif_id`),
  KEY `fk_notification_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=607 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
CREATE TABLE IF NOT EXISTS `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `reported_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `reason` text COLLATE utf8mb4_general_ci NOT NULL,
  `status` enum('pending','reviewed','resolved','rejected') COLLATE utf8mb4_general_ci DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_report_reporter` (`reporter_id`),
  KEY `fk_report_reported` (`reported_id`)
) ENGINE=InnoDB AUTO_INCREMENT=704 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `swapitem`
--

DROP TABLE IF EXISTS `swapitem`;
CREATE TABLE IF NOT EXISTS `swapitem` (
  `item_id` int NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `swapoffer`
--

DROP TABLE IF EXISTS `swapoffer`;
CREATE TABLE IF NOT EXISTS `swapoffer` (
  `swap_id` int NOT NULL AUTO_INCREMENT,
  `swap_status` enum('pending','completed','lost','cancelled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `user_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `requested_item_id` int NOT NULL,
  `offered_item_id` int NOT NULL,
  PRIMARY KEY (`swap_id`),
  KEY `fk_swapoffer_item` (`item_id`),
  KEY `fk_swapoffer_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=216 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactionreceipt`
--

DROP TABLE IF EXISTS `transactionreceipt`;
CREATE TABLE IF NOT EXISTS `transactionreceipt` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `status` enum('pending','successful','failed','cancelled') COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `item_id` int NOT NULL,
  `buyer_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `seller_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `bid_id` int DEFAULT NULL,
  `swap_id` int DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `fk_transaction_item` (`item_id`),
  KEY `fk_transaction_buyer` (`buyer_id`),
  KEY `fk_transaction_seller` (`seller_id`),
  KEY `fk_transaction_bid` (`bid_id`),
  KEY `fk_transaction_swap` (`swap_id`)
) ENGINE=InnoDB AUTO_INCREMENT=309 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_general_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_general_ci NOT NULL,
  `warning_count` int DEFAULT '0',
  `is_banned` tinyint(1) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `email`, `password`, `username`, `warning_count`, `is_banned`, `is_deleted`) VALUES
('2244560', '2244560@slu.edu.ph', '$2y$10$CXsN7pO0ugIGrW3iaaPT6.gBj.QSQvapro4gVJu2gMqZxyx7OewAa', 'Byron', 0, 0, 0),
('u1', 'alice@slu.edu.ph', 'hello123', 'AliceSeller', 0, 0, 0),
('u10', 'john@slu.edu.ph', 'hello123', 'John', 0, 0, 0),
('u11', 'kate@slu.edu.ph', 'hello123', 'Kate', 0, 0, 0),
('u12', 'leo@slu.edu.ph', 'hello123', 'Leo', 0, 0, 0),
('u13', 'maria@slu.edu.ph', 'hello123', 'Maria', 0, 0, 0),
('u14', 'nick@slu.edu.ph', 'hello123', 'Nick', 0, 0, 0),
('u15', 'olga@slu.edu.ph', 'hello123', 'Olga', 0, 1, 0),
('u2', 'bob@slu.edu.ph', 'hello123', 'BobBuyer', 0, 0, 0),
('u3', 'carla@slu.edu.ph', 'hello123', 'Carla', 1, 0, 0),
('u4', 'dave@slu.edu.ph', 'hello123', 'Dave', 0, 0, 0),
('u5', 'ella@slu.edu.ph', 'hello123', 'Ella', 0, 0, 0),
('u6', 'franz@slu.edu.ph', 'hello123', 'Franz', 0, 0, 0),
('u7', 'gina@slu.edu.ph', 'hello123', 'Gina', 2, 0, 0),
('u8', 'hugo@slu.edu.ph', 'pass123', 'Hugo1', 0, 0, 1),
('u9', 'ivy@slu.edu.ph', 'hello123', 'Ivy', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `userrating`
--

DROP TABLE IF EXISTS `userrating`;
CREATE TABLE IF NOT EXISTS `userrating` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `rating` int DEFAULT NULL,
  `comment` text COLLATE utf8mb4_general_ci,
  `rater_id` varchar(20) COLLATE utf8mb4_general_ci NOT NULL,
  `transaction_id` int DEFAULT NULL,
  PRIMARY KEY (`rating_id`),
  KEY `fk_userrating_rater` (`rater_id`),
  KEY `fk_userrating_transaction` (`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=808 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `biditem`
--
ALTER TABLE `biditem`
  ADD CONSTRAINT `fk_biditem_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `bidoffer`
--
ALTER TABLE `bidoffer`
  ADD CONSTRAINT `fk_bidoffer_bidder` FOREIGN KEY (`bidder_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_bidoffer_biditem` FOREIGN KEY (`item_id`) REFERENCES `biditem` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `chat`
--
ALTER TABLE `chat`
  ADD CONSTRAINT `fk_chat_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_chat_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `item`
--
ALTER TABLE `item`
  ADD CONSTRAINT `fk_item_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `itemimage`
--
ALTER TABLE `itemimage`
  ADD CONSTRAINT `fk_itemimage_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `message`
--
ALTER TABLE `message`
  ADD CONSTRAINT `fk_message_chat` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_message_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `notification`
--
ALTER TABLE `notification`
  ADD CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `report`
--
ALTER TABLE `report`
  ADD CONSTRAINT `fk_report_reported` FOREIGN KEY (`reported_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `swapitem`
--
ALTER TABLE `swapitem`
  ADD CONSTRAINT `fk_swapitem_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Constraints for table `swapoffer`
--
ALTER TABLE `swapoffer`
  ADD CONSTRAINT `fk_swapoffer_swapitem` FOREIGN KEY (`item_id`) REFERENCES `swapitem` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_swapoffer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE;

--
-- Constraints for table `transactionreceipt`
--
ALTER TABLE `transactionreceipt`
  ADD CONSTRAINT `fk_transaction_bid` FOREIGN KEY (`bid_id`) REFERENCES `bidoffer` (`bid_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_transaction_swap` FOREIGN KEY (`swap_id`) REFERENCES `swapoffer` (`swap_id`) ON UPDATE CASCADE;

--
-- Constraints for table `userrating`
--
ALTER TABLE `userrating`
  ADD CONSTRAINT `fk_userrating_rater` FOREIGN KEY (`rater_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_userrating_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactionreceipt` (`transaction_id`) ON DELETE SET NULL ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

-- phpMyAdmin SQL Dump
-- version 5.2.3
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1:3306
-- Generation Time: Dec 02, 2025 at 07:08 AM
-- Server version: 8.4.7
-- PHP Version: 8.3.28

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
-- Create the database
CREATE DATABASE bidops
CHARACTER SET utf8mb4
COLLATE utf8mb4_general_ci;

-- Select the database
USE bidops;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `bidops`
--
-- Set root password to blank and use native authentication
-- ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '';
FLUSH PRIVILEGES;
CREATE DATABASE IF NOT EXISTS `bidops` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `bidops`;

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
CREATE TABLE IF NOT EXISTS `admin` (
  `admin_id` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

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
  `bid_increment_percent` int DEFAULT '5',
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `biditem`
--

INSERT INTO `biditem` (`item_id`, `starting_price`, `start_date`, `end_date`, `bid_increment_percent`) VALUES
(1, 25000.00, '2025-09-20 10:00:00', '2025-09-28 12:00:00', 5),
(2, 48000.00, '2025-10-01 10:30:00', '2025-10-08 10:30:00', 5),
(5, 1500.00, '2025-09-25 08:00:00', '2025-09-27 08:00:00', 5),
(6, 9000.00, '2025-10-18 13:00:00', '2025-10-25 13:00:00', 5),
(8, 2500.00, '2025-10-03 14:00:00', '2025-10-10 14:00:00', 5),
(10, 800.00, '2025-10-22 09:15:00', '2025-10-25 09:15:00', 5),
(11, 3500.00, '2025-10-12 10:00:00', '2025-10-19 10:00:00', 5),
(13, 12000.00, '2025-10-08 09:20:00', '2025-10-15 09:20:00', 5),
(15, 7000.00, '2025-10-20 18:30:00', '2025-10-27 18:30:00', 5);

-- --------------------------------------------------------

--
-- Table structure for table `bidoffer`
--

DROP TABLE IF EXISTS `bidoffer`;
CREATE TABLE IF NOT EXISTS `bidoffer` (
  `bid_id` int NOT NULL AUTO_INCREMENT,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_status` enum('active','won','lost','pending','retracted') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `bidder_id` varchar(20) NOT NULL,
  PRIMARY KEY (`bid_id`),
  KEY `fk_bidoffer_item` (`item_id`),
  KEY `fk_bidoffer_bidder` (`bidder_id`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `bidoffer`
--

INSERT INTO `bidoffer` (`bid_id`, `bid_amount`, `bid_status`, `created_at`, `item_id`, `bidder_id`) VALUES
(101, 26000.00, 'pending', '2025-09-26 13:00:00', 1, 'u2'),
(102, 27000.00, 'won', '2025-09-27 15:00:00', 1, 'u5'),
(103, 52000.00, 'active', '2025-10-03 11:00:00', 2, 'u4'),
(104, 50000.00, 'lost', '2025-10-04 14:30:00', 2, 'u9'),
(105, 1600.00, 'won', '2025-09-26 10:00:00', 5, 'u8'),
(106, 2700.00, 'active', '2025-10-08 09:45:00', 8, 'u9'),
(107, 900.00, 'pending', '2025-10-23 09:45:00', 10, 'u3'),
(108, 3800.00, 'active', '2025-10-13 12:00:00', 11, 'u2'),
(109, 12500.00, 'pending', '2025-10-09 10:00:00', 13, 'u14'),
(110, 7500.00, 'active', '2025-10-21 19:00:00', 15, 'u12');

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
CREATE TABLE IF NOT EXISTS `chat` (
  `chat_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `seller_id` varchar(20) NOT NULL,
  `buyer_id` varchar(20) NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`chat_id`),
  UNIQUE KEY `unique_chat` (`buyer_id`, `seller_id`, `item_id`),
  KEY `fk_chat_seller` (`seller_id`),
  KEY `fk_chat_buyer` (`buyer_id`),
  KEY `fk_chat_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=407 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `chat`
--
INSERT INTO `chat` (`chat_id`, `created_at`, `seller_id`, `buyer_id`, `item_id`) VALUES
(401, '2025-09-26 12:45:00', 'u1', 'u2', 1),
(402, '2025-10-02 09:30:00', 'u2', 'u4', 2),
(403, '2025-10-05 10:00:00', 'u3', 'u5', 3),
(404, '2025-10-07 11:00:00', 'u4', 'u6', 4),
(405, '2025-10-08 14:30:00', 'u9', 'u1', 9),
(406, '2025-10-10 18:00:00', 'u14', 'u12', 15);

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
CREATE TABLE IF NOT EXISTS `item` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text,
  `category_type` varchar(50) DEFAULT NULL,
  `status` enum('pending_approval','approval_rejected','active','sold') DEFAULT 'pending_approval',
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_type` enum('bid','swap') NOT NULL,
  `seller_id` varchar(20) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_item_seller` (`seller_id`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `title`, `description`, `category_type`, `status`, `created_date`, `item_type`, `seller_id`) VALUES
(1, 'iPhone 13', '256GB, good condition', 'Electronics', 'sold', '2025-09-28 12:00:00', 'bid', 'u1'),
(2, 'Gaming Laptop', 'RTX3060, 16GB RAM', 'Electronics', 'active', '2025-10-01 10:30:00', 'bid', 'u2'),
(3, 'Mountain Bike', '29\" frame, lightweight', 'Sports', 'active', '2025-10-03 09:00:00', 'swap', 'u3'),
(4, 'Vintage Camera', 'Analog film camera, working', 'Collectibles', 'active', '2025-10-05 11:00:00', 'swap', 'u4'),
(5, 'Bluetooth Headset', 'Noise-cancelling, used', 'Accessories', 'sold', '2025-09-25 08:00:00', 'bid', 'u5'),
(6, 'Tablet', 'Android 11, 8GB RAM', 'Electronics', 'pending_approval', '2025-10-18 13:00:00', 'bid', 'u6'),
(7, 'Sneakers', 'Men size 10, lightly used', 'Fashion', 'approval_rejected', '2025-10-20 15:30:00', 'swap', 'u7'),
(8, 'Smartwatch', 'Waterproof, GPS', 'Accessories', 'sold', '2025-10-10 14:00:00', 'bid', 'u8'),
(9, 'PS5 Controller', 'DualSense white', 'Gaming', 'active', '2025-10-17 16:45:00', 'swap', 'u9'),
(10, 'Desk Lamp', 'LED lamp with dimmer', 'Home', 'active', '2025-10-22 09:15:00', 'bid', 'u10'),
(11, 'Mechanical KB', 'TKL, cherry brown', 'Electronics', 'active', '2025-10-12 10:00:00', 'bid', 'u1'),
(12, 'Graphic Tablet', 'Drawing tablet, pen included', 'Electronics', 'active', '2025-10-14 13:10:00', 'swap', 'u11'),
(13, 'DSLR Lens', '50mm prime, like new', 'Photography', 'active', '2025-10-08 09:20:00', 'bid', 'u12'),
(14, 'Board Game', 'Catan 5-6 players', 'Toys', 'active', '2025-10-09 16:00:00', 'swap', 'u13'),
(15, 'Monitor 24\"', '1080p 75Hz', 'Electronics', 'active', '2025-10-20 18:30:00', 'bid', 'u14');

-- --------------------------------------------------------

--
-- Table structure for table `itemimage`
--

DROP TABLE IF EXISTS `itemimage`;
CREATE TABLE IF NOT EXISTS `itemimage` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_itemimage_item` (`item_id`)
) ENGINE=InnoDB AUTO_INCREMENT=439 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `itemimage`
--

INSERT INTO `itemimage` (`image_id`, `image_path`, `item_id`) VALUES
(401, 'uploads/iphone13.jpg', 1),
(402, 'uploads/gaming_laptop.jpg', 2),
(403, 'uploads/mountain_bike.jpg', 3),
(404, 'uploads/camera.jpg', 4),
(405, 'uploads/headset.jpg', 5),
(406, 'uploads/tablet.jpg', 6),
(407, 'uploads/sneakers.jpg', 7),
(408, 'uploads/smartwatch.jpg', 8),
(409, 'uploads/ps5_ctrl.jpg', 9),
(410, 'uploads/desklamp.jpg', 10),
(411, 'uploads/kb.jpg', 11),
(412, 'uploads/gtab.jpg', 12),
(413, 'uploads/lens.jpg', 13),
(414, 'uploads/boardgame.jpg', 14),
(415, 'uploads/monitor24.jpg', 15);

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
CREATE TABLE IF NOT EXISTS `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `chat_id` int NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `fk_message_chat` (`chat_id`),
  KEY `fk_message_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=514 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `message`
--

INSERT INTO `message` (`message_id`, `message`, `sent_at`, `chat_id`, `user_id`) VALUES
(501, 'Hi, is the iPhone still available?', '2025-09-26 12:46:00', 401, 'u2'),
(502, 'Yes, still available!', '2025-09-26 12:47:00', 401, 'u1'),
(503, 'Can you do meet-up near SLU?', '2025-09-26 12:48:30', 401, 'u2'),
(504, 'Is the gaming laptop negotiable?', '2025-10-02 09:31:00', 402, 'u4'),
(505, 'Price is fixed for now.', '2025-10-02 09:33:00', 402, 'u2'),
(506, 'Your mountain bike looks great!', '2025-10-05 10:01:00', 403, 'u5'),
(507, 'Thanks! Interested in swapping?', '2025-10-05 10:02:00', 403, 'u3'),
(508, 'Can I see more pictures of the camera?', '2025-10-07 11:01:00', 404, 'u6'),
(509, 'Sure, sending shortly.', '2025-10-07 11:02:00', 404, 'u4'),
(510, 'Still have the PS5 controller?', '2025-10-08 14:31:00', 405, 'u1'),
(511, 'Yes, available for swap.', '2025-10-08 14:32:00', 405, 'u9'),
(512, 'Is this monitor compatible with HDMI?', '2025-10-10 18:01:00', 406, 'u12'),
(513, 'Yes, supports HDMI and DP.', '2025-10-10 18:02:00', 406, 'u14');

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
CREATE TABLE IF NOT EXISTS `notification` (
  `notif_id` int NOT NULL AUTO_INCREMENT,
  `type` enum('bid_won','bid_accepted','swap_accepted','swap_rejected','listing_approved','listing_rejected','message','report_result','item_cancelled') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `message` text,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`notif_id`),
  KEY `fk_notification_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=607 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `notification`
--

INSERT INTO `notification` (`notif_id`, `type`, `created_at`, `message`, `user_id`) VALUES
(601, 'listing_approved', '2025-10-01 10:00:00', 'Your item \"Gaming Laptop\" has been approved.', 'u2'),
(602, 'bid_won', '2025-09-28 12:35:00', 'You won the bid for \"iPhone 13\".', 'u5'),
(603, 'swap_accepted', '2025-10-07 12:05:00', 'Your swap for \"Vintage Camera\" was accepted.', 'u6'),
(604, 'listing_rejected', '2025-10-20 16:00:00', 'Your item \"Sneakers\" was rejected by admin.', 'u7'),
(605, 'message', '2025-10-08 14:33:00', 'New message received in your chat about \"PS5 Controller\".', 'u9'),
(606, 'report_result', '2025-10-18 11:30:00', 'Your report has been reviewed by admin.', 'u3');

-- --------------------------------------------------------

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
CREATE TABLE IF NOT EXISTS `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` varchar(20) NOT NULL,
  `reported_id` varchar(20) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_report_reporter` (`reporter_id`),
  KEY `fk_report_reported` (`reported_id`)
) ENGINE=InnoDB AUTO_INCREMENT=704 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `report`
--

INSERT INTO `report` (`report_id`, `reporter_id`, `reported_id`, `reason`, `status`, `created_at`) VALUES
(701, 'u3', 'u7', 'Rude communication during chat.', 'reviewed', '2025-10-06 09:00:00'),
(702, 'u8', 'u5', 'Sold defective item without notice.', 'resolved', '2025-10-10 15:30:00'),
(703, 'u10', 'u14', 'Spamming swap offers repeatedly.', 'pending', '2025-10-21 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `swapitem`
--

DROP TABLE IF EXISTS `swapitem`;
CREATE TABLE IF NOT EXISTS `swapitem` (
  `item_id` int NOT NULL,
  PRIMARY KEY (`item_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `swapitem`
--

INSERT INTO `swapitem` (`item_id`) VALUES
(3),
(4),
(7),
(9),
(12),
(14);

-- --------------------------------------------------------

--
-- Table structure for table `swapoffer`
--

DROP TABLE IF EXISTS `swapoffer`;
CREATE TABLE IF NOT EXISTS `swapoffer` (
  `swap_id` int NOT NULL AUTO_INCREMENT,
  `swap_status` enum('pending','completed','lost','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`swap_id`),
  KEY `fk_swapoffer_item` (`item_id`),
  KEY `fk_swapoffer_user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `swapoffer`
--

INSERT INTO `swapoffer` (`swap_id`, `swap_status`, `created_at`, `item_id`, `user_id`) VALUES
(201, 'pending', '2025-10-05 15:00:00', 3, 'u5'),
(202, 'completed', '2025-10-07 11:30:00', 4, 'u6'),
(203, 'lost', '2025-10-10 10:15:00', 7, 'u10'),
(204, 'cancelled', '2025-10-18 09:00:00', 9, 'u1'),
(205, 'pending', '2025-10-15 14:10:00', 12, 'u14');

-- --------------------------------------------------------

--
-- Table structure for table `transactionreceipt`
--

DROP TABLE IF EXISTS `transactionreceipt`;
CREATE TABLE IF NOT EXISTS `transactionreceipt` (
  `transaction_id` int NOT NULL AUTO_INCREMENT,
  `status` enum('pending','successful','failed','cancelled') NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `item_id` int NOT NULL,
  `buyer_id` varchar(20) NOT NULL,
  `seller_id` varchar(20) NOT NULL,
  `bid_id` int DEFAULT NULL,
  `swap_id` int DEFAULT NULL,
  PRIMARY KEY (`transaction_id`),
  KEY `fk_transaction_item` (`item_id`),
  KEY `fk_transaction_buyer` (`buyer_id`),
  KEY `fk_transaction_seller` (`seller_id`),
  KEY `fk_transaction_bid` (`bid_id`),
  KEY `fk_transaction_swap` (`swap_id`)
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `transactionreceipt`
--

INSERT INTO `transactionreceipt` (`transaction_id`, `status`, `completed_at`, `item_id`, `buyer_id`, `seller_id`, `bid_id`, `swap_id`) VALUES
(301, 'successful', '2025-09-28 12:30:00', 1, 'u5', 'u1', 102, NULL),
(302, 'pending', NULL, 2, 'u4', 'u2', 103, NULL),
(303, 'failed', NULL, 3, 'u5', 'u3', NULL, 201),
(304, 'successful', '2025-10-07 12:00:00', 4, 'u6', 'u4', NULL, 202),
(305, 'cancelled', '2025-10-10 14:00:00', 9, 'u1', 'u9', NULL, 204),
(306, 'successful', '2025-09-26 10:15:00', 5, 'u8', 'u5', 105, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
CREATE TABLE IF NOT EXISTS `user` (
  `user_id` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `warning_count` int DEFAULT '0',
  `is_banned` tinyint(1) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`user_id`, `email`, `password`, `username`, `warning_count`, `is_banned`, `is_deleted`) VALUES
('u1', 'alice@slu.edu.ph', 'pass123', 'AliceSeller', 0, 0, 0),
('u10', 'john@slu.edu.ph', 'pass123', 'John', 0, 0, 0),
('u11', 'kate@slu.edu.ph', 'pass123', 'Kate', 0, 0, 0),
('u12', 'leo@slu.edu.ph', 'pass123', 'Leo', 0, 0, 0),
('u13', 'maria@slu.edu.ph', 'pass123', 'Maria', 0, 0, 0),
('u14', 'nick@slu.edu.ph', 'pass123', 'Nick', 0, 0, 0),
('u15', 'olga@slu.edu.ph', 'pass123', 'Olga', 0, 1, 0),
('u2', 'bob@slu.edu.ph', 'pass123', 'BobBuyer', 0, 0, 0),
('u3', 'carla@slu.edu.ph', 'pass123', 'Carla', 1, 0, 0),
('u4', 'dave@slu.edu.ph', 'pass123', 'Dave', 0, 0, 0),
('u5', 'ella@slu.edu.ph', 'pass123', 'Ella', 0, 0, 0),
('u6', 'franz@slu.edu.ph', 'pass123', 'Franz', 0, 0, 0),
('u7', 'gina@slu.edu.ph', 'pass123', 'Gina', 2, 0, 0),
('u8', 'hugo@slu.edu.ph', 'pass123', 'Hugo', 0, 0, 0),
('u9', 'ivy@slu.edu.ph', 'pass123', 'Ivy', 0, 0, 0);

-- --------------------------------------------------------

--
-- Table structure for table `userrating`
--

DROP TABLE IF EXISTS `userrating`;
CREATE TABLE IF NOT EXISTS `userrating` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `rating` int DEFAULT NULL,
  `comment` text,
  `rater_id` varchar(20) NOT NULL,
  `transaction_id` int DEFAULT NULL,
  PRIMARY KEY (`rating_id`),
  KEY `fk_userrating_rater` (`rater_id`),
  KEY `fk_userrating_transaction` (`transaction_id`)
) ENGINE=InnoDB AUTO_INCREMENT=807 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `userrating`
--

INSERT INTO `userrating` (`rating_id`, `rating`, `comment`, `rater_id`, `transaction_id`) VALUES
(801, 5, 'Smooth transaction, highly recommended!', 'u5', 301),
(802, 4, 'Friendly buyer, item as described.', 'u1', 301),
(803, 3, 'Took long to respond.', 'u4', 302),
(804, 5, 'Great swap experience!', 'u6', 304),
(805, 2, 'Cancelled transaction unexpectedly.', 'u9', 305),
(806, 5, 'Quick payment, very polite.', 'u8', 306);

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
  ADD CONSTRAINT `fk_item_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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
  ADD CONSTRAINT `fk_report_reported` FOREIGN KEY (`reported_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

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

-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 13, 2025 at 12:54 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

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

CREATE TABLE `admin` (
  `admin_id` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
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

CREATE TABLE `biditem` (
  `item_id` int(11) NOT NULL,
  `starting_price` decimal(10,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  `bid_increment_percent` decimal(5,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `biditem`
--

INSERT INTO `biditem` (`item_id`, `starting_price`, `start_date`, `end_date`, `bid_increment_percent`) VALUES
(19, 534.00, '2025-12-13 17:21:23', '2025-12-13 18:28:00', 5.00);

-- --------------------------------------------------------

--
-- Table structure for table `bidoffer`
--

CREATE TABLE `bidoffer` (
  `bid_id` int(11) NOT NULL,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_status` enum('active','won','lost','pending','retracted') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `item_id` int(11) NOT NULL,
  `bidder_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat`
--

CREATE TABLE `chat` (
  `chat_id` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `seller_id` varchar(20) NOT NULL,
  `buyer_id` varchar(20) NOT NULL,
  `item_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `item`
--

CREATE TABLE `item` (
  `item_id` int(11) NOT NULL,
  `title` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `category_type` varchar(50) DEFAULT NULL,
  `status` enum('pending_approval','approval_rejected','active','sold') DEFAULT 'pending_approval',
  `created_date` datetime DEFAULT current_timestamp(),
  `item_type` enum('bid','swap') NOT NULL,
  `seller_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `item`
--

INSERT INTO `item` (`item_id`, `title`, `description`, `category_type`, `status`, `created_date`, `item_type`, `seller_id`) VALUES
(19, 'Calculator', 'casllsalslalsals', 'Electronics', 'active', '2025-12-13 17:21:23', 'bid', 'u10'),
(20, 'Bike', 'fixie bikebiekeiekei', 'Sports', 'active', '2025-12-13 17:23:06', 'swap', 'u10');

-- --------------------------------------------------------

--
-- Table structure for table `itemimage`
--

CREATE TABLE `itemimage` (
  `image_id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `item_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `itemimage`
--

INSERT INTO `itemimage` (`image_id`, `image_path`, `item_id`) VALUES
(419, 'uploads/item_1765617683_693d301310f81.webp', 19),
(420, 'uploads/item_1765617786_693d307a1f17f.jpg', 20);

-- --------------------------------------------------------

--
-- Table structure for table `message`
--

CREATE TABLE `message` (
  `message_id` int(11) NOT NULL,
  `message` text NOT NULL,
  `sent_at` datetime DEFAULT current_timestamp(),
  `chat_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `notification`
--

CREATE TABLE `notification` (
  `notif_id` int(11) NOT NULL,
  `type` enum('bid_won','bid_accepted','swap_accepted','swap_rejected','listing_approved','listing_rejected','message','report_result','item_cancelled') NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `message` text DEFAULT NULL,
  `user_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

CREATE TABLE `report` (
  `report_id` int(11) NOT NULL,
  `reporter_id` varchar(20) NOT NULL,
  `reported_id` varchar(20) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `report`
--

INSERT INTO `report` (`report_id`, `reporter_id`, `reported_id`, `reason`, `status`, `created_at`) VALUES
(701, 'u3', 'u7', 'Rude communication during chat.', 'reviewed', '2024-10-06 09:00:00'),
(702, 'u8', 'u5', 'Sold defective item without notice.', 'resolved', '2025-10-10 15:30:00'),
(703, 'u10', 'u14', 'Spamming swap offers repeatedly.', 'pending', '2025-10-21 10:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `swapitem`
--

CREATE TABLE `swapitem` (
  `item_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `swapitem`
--

INSERT INTO `swapitem` (`item_id`) VALUES
(20);

-- --------------------------------------------------------

--
-- Table structure for table `swapoffer`
--

CREATE TABLE `swapoffer` (
  `swap_id` int(11) NOT NULL,
  `swap_status` enum('pending','completed','lost','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT current_timestamp(),
  `item_id` int(11) NOT NULL,
  `user_id` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `transactionreceipt`
--

CREATE TABLE `transactionreceipt` (
  `transaction_id` int(11) NOT NULL,
  `status` enum('pending','successful','failed','cancelled') NOT NULL DEFAULT 'pending',
  `completed_at` datetime DEFAULT NULL,
  `item_id` int(11) NOT NULL,
  `buyer_id` varchar(20) NOT NULL,
  `seller_id` varchar(20) NOT NULL,
  `bid_id` int(11) DEFAULT NULL,
  `swap_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `user_id` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(255) NOT NULL,
  `username` varchar(50) NOT NULL,
  `warning_count` int(11) DEFAULT 0,
  `is_banned` tinyint(1) NOT NULL,
  `is_deleted` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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

CREATE TABLE `userrating` (
  `rating_id` int(11) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `comment` text DEFAULT NULL,
  `rater_id` varchar(20) NOT NULL,
  `transaction_id` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userrating`
--

INSERT INTO `userrating` (`rating_id`, `rating`, `comment`, `rater_id`, `transaction_id`) VALUES
(801, 5, 'Smooth transaction, highly recommended!', 'u5', NULL),
(802, 4, 'Friendly buyer, item as described.', 'u1', NULL),
(803, 3, 'Took long to respond.', 'u4', NULL),
(804, 5, 'Great swap experience!', 'u6', NULL),
(805, 2, 'Cancelled transaction unexpectedly.', 'u9', NULL),
(806, 5, 'Quick payment, very polite.', 'u8', NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`admin_id`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `biditem`
--
ALTER TABLE `biditem`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `bidoffer`
--
ALTER TABLE `bidoffer`
  ADD PRIMARY KEY (`bid_id`),
  ADD KEY `fk_bidoffer_item` (`item_id`),
  ADD KEY `fk_bidoffer_bidder` (`bidder_id`);

--
-- Indexes for table `chat`
--
ALTER TABLE `chat`
  ADD PRIMARY KEY (`chat_id`),
  ADD KEY `fk_chat_seller` (`seller_id`),
  ADD KEY `fk_chat_buyer` (`buyer_id`),
  ADD KEY `fk_chat_item` (`item_id`);

--
-- Indexes for table `item`
--
ALTER TABLE `item`
  ADD PRIMARY KEY (`item_id`),
  ADD KEY `fk_item_seller` (`seller_id`);

--
-- Indexes for table `itemimage`
--
ALTER TABLE `itemimage`
  ADD PRIMARY KEY (`image_id`),
  ADD KEY `fk_itemimage_item` (`item_id`);

--
-- Indexes for table `message`
--
ALTER TABLE `message`
  ADD PRIMARY KEY (`message_id`),
  ADD KEY `fk_message_chat` (`chat_id`),
  ADD KEY `fk_message_user` (`user_id`);

--
-- Indexes for table `notification`
--
ALTER TABLE `notification`
  ADD PRIMARY KEY (`notif_id`),
  ADD KEY `fk_notification_user` (`user_id`);

--
-- Indexes for table `report`
--
ALTER TABLE `report`
  ADD PRIMARY KEY (`report_id`),
  ADD KEY `fk_report_reporter` (`reporter_id`),
  ADD KEY `fk_report_reported` (`reported_id`);

--
-- Indexes for table `swapitem`
--
ALTER TABLE `swapitem`
  ADD PRIMARY KEY (`item_id`);

--
-- Indexes for table `swapoffer`
--
ALTER TABLE `swapoffer`
  ADD PRIMARY KEY (`swap_id`),
  ADD KEY `fk_swapoffer_item` (`item_id`),
  ADD KEY `fk_swapoffer_user` (`user_id`);

--
-- Indexes for table `transactionreceipt`
--
ALTER TABLE `transactionreceipt`
  ADD PRIMARY KEY (`transaction_id`),
  ADD KEY `fk_transaction_item` (`item_id`),
  ADD KEY `fk_transaction_buyer` (`buyer_id`),
  ADD KEY `fk_transaction_seller` (`seller_id`),
  ADD KEY `fk_transaction_bid` (`bid_id`),
  ADD KEY `fk_transaction_swap` (`swap_id`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`user_id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `username` (`username`);

--
-- Indexes for table `userrating`
--
ALTER TABLE `userrating`
  ADD PRIMARY KEY (`rating_id`),
  ADD KEY `fk_userrating_rater` (`rater_id`),
  ADD KEY `fk_userrating_transaction` (`transaction_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `bidoffer`
--
ALTER TABLE `bidoffer`
  MODIFY `bid_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=116;

--
-- AUTO_INCREMENT for table `chat`
--
ALTER TABLE `chat`
  MODIFY `chat_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=411;

--
-- AUTO_INCREMENT for table `item`
--
ALTER TABLE `item`
  MODIFY `item_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `itemimage`
--
ALTER TABLE `itemimage`
  MODIFY `image_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=421;

--
-- AUTO_INCREMENT for table `message`
--
ALTER TABLE `message`
  MODIFY `message_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=518;

--
-- AUTO_INCREMENT for table `notification`
--
ALTER TABLE `notification`
  MODIFY `notif_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=607;

--
-- AUTO_INCREMENT for table `report`
--
ALTER TABLE `report`
  MODIFY `report_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=704;

--
-- AUTO_INCREMENT for table `swapoffer`
--
ALTER TABLE `swapoffer`
  MODIFY `swap_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=206;

--
-- AUTO_INCREMENT for table `transactionreceipt`
--
ALTER TABLE `transactionreceipt`
  MODIFY `transaction_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=307;

--
-- AUTO_INCREMENT for table `userrating`
--
ALTER TABLE `userrating`
  MODIFY `rating_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=807;

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

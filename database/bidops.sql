-- MySQL dump 10.13  Distrib 9.1.0, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: bidops
-- ------------------------------------------------------
-- Server version	9.1.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `admin`
--

DROP TABLE IF EXISTS `admin`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin` (
  `admin_id` varchar(20) NOT NULL,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  PRIMARY KEY (`admin_id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin`
--

LOCK TABLES `admin` WRITE;
/*!40000 ALTER TABLE `admin` DISABLE KEYS */;
INSERT INTO `admin` VALUES ('A1','superadmin','adminpass');
/*!40000 ALTER TABLE `admin` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `biditem`
--

DROP TABLE IF EXISTS `biditem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `biditem` (
  `item_id` int NOT NULL,
  `starting_price` decimal(10,2) NOT NULL,
  `start_date` datetime NOT NULL,
  `end_date` datetime NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_biditem_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `biditem`
--

LOCK TABLES `biditem` WRITE;
/*!40000 ALTER TABLE `biditem` DISABLE KEYS */;
INSERT INTO `biditem` VALUES (1,25000.00,'2025-09-20 10:00:00','2025-09-28 12:00:00'),(2,48000.00,'2025-10-01 10:30:00','2025-10-08 10:30:00'),(5,1500.00,'2025-09-25 08:00:00','2025-09-27 08:00:00'),(6,9000.00,'2025-10-18 13:00:00','2025-10-25 13:00:00'),(8,2500.00,'2025-10-03 14:00:00','2025-10-10 14:00:00'),(10,800.00,'2025-10-22 09:15:00','2025-10-25 09:15:00'),(11,3500.00,'2025-10-12 10:00:00','2025-10-19 10:00:00'),(13,12000.00,'2025-10-08 09:20:00','2025-10-15 09:20:00'),(15,7000.00,'2025-10-20 18:30:00','2025-10-27 18:30:00');
/*!40000 ALTER TABLE `biditem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bidoffer`
--

DROP TABLE IF EXISTS `bidoffer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bidoffer` (
  `bid_id` int NOT NULL AUTO_INCREMENT,
  `bid_amount` decimal(10,2) NOT NULL,
  `bid_status` enum('active','won','lost','pending','retracted') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `bidder_id` varchar(20) NOT NULL,
  PRIMARY KEY (`bid_id`),
  KEY `fk_bidoffer_item` (`item_id`),
  KEY `fk_bidoffer_bidder` (`bidder_id`),
  CONSTRAINT `fk_bidoffer_bidder` FOREIGN KEY (`bidder_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_bidoffer_biditem` FOREIGN KEY (`item_id`) REFERENCES `biditem` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bidoffer`
--

LOCK TABLES `bidoffer` WRITE;
/*!40000 ALTER TABLE `bidoffer` DISABLE KEYS */;
INSERT INTO `bidoffer` VALUES (101,26000.00,'pending','2025-09-26 13:00:00',1,'u2'),(102,27000.00,'won','2025-09-27 15:00:00',1,'u5'),(103,52000.00,'active','2025-10-03 11:00:00',2,'u4'),(104,50000.00,'lost','2025-10-04 14:30:00',2,'u9'),(105,1600.00,'won','2025-09-26 10:00:00',5,'u8'),(106,2700.00,'active','2025-10-08 09:45:00',8,'u9'),(107,900.00,'pending','2025-10-23 09:45:00',10,'u3'),(108,3800.00,'active','2025-10-13 12:00:00',11,'u2'),(109,12500.00,'pending','2025-10-09 10:00:00',13,'u14'),(110,7500.00,'active','2025-10-21 19:00:00',15,'u12');
/*!40000 ALTER TABLE `bidoffer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chat`
--

DROP TABLE IF EXISTS `chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chat` (
  `chat_id` int NOT NULL AUTO_INCREMENT,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `seller_id` varchar(20) NOT NULL,
  `buyer_id` varchar(20) NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`chat_id`),
  KEY `fk_chat_seller` (`seller_id`),
  KEY `fk_chat_buyer` (`buyer_id`),
  KEY `fk_chat_item` (`item_id`),
  CONSTRAINT `fk_chat_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_chat_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=407 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chat`
--

LOCK TABLES `chat` WRITE;
/*!40000 ALTER TABLE `chat` DISABLE KEYS */;
INSERT INTO `chat` VALUES (401,'2025-09-26 12:45:00','u1','u2',1),(402,'2025-10-02 09:30:00','u2','u4',2),(403,'2025-10-05 10:00:00','u3','u5',3),(404,'2025-10-07 11:00:00','u4','u6',4),(405,'2025-10-08 14:30:00','u9','u1',9),(406,'2025-10-10 18:00:00','u14','u12',15);
/*!40000 ALTER TABLE `chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `item`
--

DROP TABLE IF EXISTS `item`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `item` (
  `item_id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(100) NOT NULL,
  `description` text,
  `category_type` varchar(50) DEFAULT NULL,
  `status` enum('pending_approval','approval_rejected','active','sold') DEFAULT 'pending_approval',
  `created_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_type` enum('bid','swap') NOT NULL,
  `seller_id` varchar(20) NOT NULL,
  PRIMARY KEY (`item_id`),
  KEY `fk_item_seller` (`seller_id`),
  CONSTRAINT `fk_item_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `item`
--

LOCK TABLES `item` WRITE;
/*!40000 ALTER TABLE `item` DISABLE KEYS */;
INSERT INTO `item` VALUES (1,'iPhone 13','256GB, good condition','Electronics','sold','2025-09-28 12:00:00','bid','u1'),(2,'Gaming Laptop','RTX3060, 16GB RAM','Electronics','active','2025-10-01 10:30:00','bid','u2'),(3,'Mountain Bike','29\" frame, lightweight','Sports','active','2025-10-03 09:00:00','swap','u3'),(4,'Vintage Camera','Analog film camera, working','Collectibles','active','2025-10-05 11:00:00','swap','u4'),(5,'Bluetooth Headset','Noise-cancelling, used','Accessories','sold','2025-09-25 08:00:00','bid','u5'),(6,'Tablet','Android 11, 8GB RAM','Electronics','pending_approval','2025-10-18 13:00:00','bid','u6'),(7,'Sneakers','Men size 10, lightly used','Fashion','approval_rejected','2025-10-20 15:30:00','swap','u7'),(8,'Smartwatch','Waterproof, GPS','Accessories','sold','2025-10-10 14:00:00','bid','u8'),(9,'PS5 Controller','DualSense white','Gaming','active','2025-10-17 16:45:00','swap','u9'),(10,'Desk Lamp','LED lamp with dimmer','Home','active','2025-10-22 09:15:00','bid','u10'),(11,'Mechanical KB','TKL, cherry brown','Electronics','active','2025-10-12 10:00:00','bid','u1'),(12,'Graphic Tablet','Drawing tablet, pen included','Electronics','active','2025-10-14 13:10:00','swap','u11'),(13,'DSLR Lens','50mm prime, like new','Photography','active','2025-10-08 09:20:00','bid','u12'),(14,'Board Game','Catan 5-6 players','Toys','active','2025-10-09 16:00:00','swap','u13'),(15,'Monitor 24\"','1080p 75Hz','Electronics','active','2025-10-20 18:30:00','bid','u14');
/*!40000 ALTER TABLE `item` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itemimage`
--

DROP TABLE IF EXISTS `itemimage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itemimage` (
  `image_id` int NOT NULL AUTO_INCREMENT,
  `image_path` varchar(255) NOT NULL,
  `item_id` int NOT NULL,
  PRIMARY KEY (`image_id`),
  KEY `fk_itemimage_item` (`item_id`),
  CONSTRAINT `fk_itemimage_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=416 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itemimage`
--

LOCK TABLES `itemimage` WRITE;
/*!40000 ALTER TABLE `itemimage` DISABLE KEYS */;
INSERT INTO `itemimage` VALUES (401,'uploads/iphone13.jpg',1),(402,'uploads/gaming_laptop.jpg',2),(403,'uploads/mountain_bike.jpg',3),(404,'uploads/camera.jpg',4),(405,'uploads/headset.jpg',5),(406,'uploads/tablet.jpg',6),(407,'uploads/sneakers.jpg',7),(408,'uploads/smartwatch.jpg',8),(409,'uploads/ps5_ctrl.jpg',9),(410,'uploads/desklamp.jpg',10),(411,'uploads/kb.jpg',11),(412,'uploads/gtab.jpg',12),(413,'uploads/lens.jpg',13),(414,'uploads/boardgame.jpg',14),(415,'uploads/monitor24.jpg',15);
/*!40000 ALTER TABLE `itemimage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message`
--

DROP TABLE IF EXISTS `message`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `message` (
  `message_id` int NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `sent_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `chat_id` int NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`message_id`),
  KEY `fk_message_chat` (`chat_id`),
  KEY `fk_message_user` (`user_id`),
  CONSTRAINT `fk_message_chat` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`chat_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_message_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=514 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message`
--

LOCK TABLES `message` WRITE;
/*!40000 ALTER TABLE `message` DISABLE KEYS */;
INSERT INTO `message` VALUES (501,'Hi, is the iPhone still available?','2025-09-26 12:46:00',401,'u2'),(502,'Yes, still available!','2025-09-26 12:47:00',401,'u1'),(503,'Can you do meet-up near SLU?','2025-09-26 12:48:30',401,'u2'),(504,'Is the gaming laptop negotiable?','2025-10-02 09:31:00',402,'u4'),(505,'Price is fixed for now.','2025-10-02 09:33:00',402,'u2'),(506,'Your mountain bike looks great!','2025-10-05 10:01:00',403,'u5'),(507,'Thanks! Interested in swapping?','2025-10-05 10:02:00',403,'u3'),(508,'Can I see more pictures of the camera?','2025-10-07 11:01:00',404,'u6'),(509,'Sure, sending shortly.','2025-10-07 11:02:00',404,'u4'),(510,'Still have the PS5 controller?','2025-10-08 14:31:00',405,'u1'),(511,'Yes, available for swap.','2025-10-08 14:32:00',405,'u9'),(512,'Is this monitor compatible with HDMI?','2025-10-10 18:01:00',406,'u12'),(513,'Yes, supports HDMI and DP.','2025-10-10 18:02:00',406,'u14');
/*!40000 ALTER TABLE `message` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification`
--

DROP TABLE IF EXISTS `notification`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification` (
  `notif_id` int NOT NULL AUTO_INCREMENT,
  `type` enum('bid_won','bid_accepted','swap_accepted','swap_rejected','listing_approved','listing_rejected','message','report_result','item_cancelled') NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `message` text,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`notif_id`),
  KEY `fk_notification_user` (`user_id`),
  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=607 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification`
--

LOCK TABLES `notification` WRITE;
/*!40000 ALTER TABLE `notification` DISABLE KEYS */;
INSERT INTO `notification` VALUES (601,'listing_approved','2025-10-01 10:00:00','Your item \"Gaming Laptop\" has been approved.','u2'),(602,'bid_won','2025-09-28 12:35:00','You won the bid for \"iPhone 13\".','u5'),(603,'swap_accepted','2025-10-07 12:05:00','Your swap for \"Vintage Camera\" was accepted.','u6'),(604,'listing_rejected','2025-10-20 16:00:00','Your item \"Sneakers\" was rejected by admin.','u7'),(605,'message','2025-10-08 14:33:00','New message received in your chat about \"PS5 Controller\".','u9'),(606,'report_result','2025-10-18 11:30:00','Your report has been reviewed by admin.','u3');
/*!40000 ALTER TABLE `notification` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `report`
--

DROP TABLE IF EXISTS `report`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `report` (
  `report_id` int NOT NULL AUTO_INCREMENT,
  `reporter_id` varchar(20) NOT NULL,
  `reported_id` varchar(20) NOT NULL,
  `reason` text NOT NULL,
  `status` enum('pending','reviewed','resolved','rejected') DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`report_id`),
  KEY `fk_report_reporter` (`reporter_id`),
  KEY `fk_report_reported` (`reported_id`),
  CONSTRAINT `fk_report_reported` FOREIGN KEY (`reported_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_report_reporter` FOREIGN KEY (`reporter_id`) REFERENCES `user` (`user_id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=704 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `report`
--

LOCK TABLES `report` WRITE;
/*!40000 ALTER TABLE `report` DISABLE KEYS */;
INSERT INTO `report` VALUES (701,'u3','u7','Rude communication during chat.','reviewed','2025-10-06 09:00:00'),(702,'u8','u5','Sold defective item without notice.','resolved','2025-10-10 15:30:00'),(703,'u10','u14','Spamming swap offers repeatedly.','pending','2025-10-21 10:00:00');
/*!40000 ALTER TABLE `report` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `swapitem`
--

DROP TABLE IF EXISTS `swapitem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `swapitem` (
  `item_id` int NOT NULL,
  PRIMARY KEY (`item_id`),
  CONSTRAINT `fk_swapitem_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `swapitem`
--

LOCK TABLES `swapitem` WRITE;
/*!40000 ALTER TABLE `swapitem` DISABLE KEYS */;
INSERT INTO `swapitem` VALUES (3),(4),(7),(9),(12),(14);
/*!40000 ALTER TABLE `swapitem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `swapoffer`
--

DROP TABLE IF EXISTS `swapoffer`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `swapoffer` (
  `swap_id` int NOT NULL AUTO_INCREMENT,
  `swap_status` enum('pending','completed','lost','cancelled') NOT NULL DEFAULT 'pending',
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `item_id` int NOT NULL,
  `user_id` varchar(20) NOT NULL,
  PRIMARY KEY (`swap_id`),
  KEY `fk_swapoffer_item` (`item_id`),
  KEY `fk_swapoffer_user` (`user_id`),
  CONSTRAINT `fk_swapoffer_swapitem` FOREIGN KEY (`item_id`) REFERENCES `swapitem` (`item_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_swapoffer_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=206 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `swapoffer`
--

LOCK TABLES `swapoffer` WRITE;
/*!40000 ALTER TABLE `swapoffer` DISABLE KEYS */;
INSERT INTO `swapoffer` VALUES (201,'pending','2025-10-05 15:00:00',3,'u5'),(202,'completed','2025-10-07 11:30:00',4,'u6'),(203,'lost','2025-10-10 10:15:00',7,'u10'),(204,'cancelled','2025-10-18 09:00:00',9,'u1'),(205,'pending','2025-10-15 14:10:00',12,'u14');
/*!40000 ALTER TABLE `swapoffer` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactionreceipt`
--

DROP TABLE IF EXISTS `transactionreceipt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `transactionreceipt` (
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
  KEY `fk_transaction_swap` (`swap_id`),
  CONSTRAINT `fk_transaction_bid` FOREIGN KEY (`bid_id`) REFERENCES `bidoffer` (`bid_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaction_buyer` FOREIGN KEY (`buyer_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaction_item` FOREIGN KEY (`item_id`) REFERENCES `item` (`item_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaction_seller` FOREIGN KEY (`seller_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_transaction_swap` FOREIGN KEY (`swap_id`) REFERENCES `swapoffer` (`swap_id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=307 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactionreceipt`
--

LOCK TABLES `transactionreceipt` WRITE;
/*!40000 ALTER TABLE `transactionreceipt` DISABLE KEYS */;
INSERT INTO `transactionreceipt` VALUES (301,'successful','2025-09-28 12:30:00',1,'u5','u1',102,NULL),(302,'pending',NULL,2,'u4','u2',103,NULL),(303,'failed',NULL,3,'u5','u3',NULL,201),(304,'successful','2025-10-07 12:00:00',4,'u6','u4',NULL,202),(305,'cancelled','2025-10-10 14:00:00',9,'u1','u9',NULL,204),(306,'successful','2025-09-26 10:15:00',5,'u8','u5',105,NULL);
/*!40000 ALTER TABLE `transactionreceipt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES ('u1','alice@slu.edu.ph','pass123','AliceSeller',0,0,0),('u10','john@slu.edu.ph','pass123','John',0,0,0),('u11','kate@slu.edu.ph','pass123','Kate',0,0,0),('u12','leo@slu.edu.ph','pass123','Leo',0,0,0),('u13','maria@slu.edu.ph','pass123','Maria',0,0,0),('u14','nick@slu.edu.ph','pass123','Nick',0,0,0),('u15','olga@slu.edu.ph','pass123','Olga',0,1,0),('u2','bob@slu.edu.ph','pass123','BobBuyer',0,0,0),('u3','carla@slu.edu.ph','pass123','Carla',1,0,0),('u4','dave@slu.edu.ph','pass123','Dave',0,0,0),('u5','ella@slu.edu.ph','pass123','Ella',0,0,0),('u6','franz@slu.edu.ph','pass123','Franz',0,0,0),('u7','gina@slu.edu.ph','pass123','Gina',2,0,0),('u8','hugo@slu.edu.ph','pass123','Hugo',0,0,0),('u9','ivy@slu.edu.ph','pass123','Ivy',0,0,0);
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `userrating`
--

DROP TABLE IF EXISTS `userrating`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `userrating` (
  `rating_id` int NOT NULL AUTO_INCREMENT,
  `rating` int DEFAULT NULL,
  `comment` text,
  `rater_id` varchar(20) NOT NULL,
  `transaction_id` int DEFAULT NULL,
  PRIMARY KEY (`rating_id`),
  KEY `fk_userrating_rater` (`rater_id`),
  KEY `fk_userrating_transaction` (`transaction_id`),
  CONSTRAINT `fk_userrating_rater` FOREIGN KEY (`rater_id`) REFERENCES `user` (`user_id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_userrating_transaction` FOREIGN KEY (`transaction_id`) REFERENCES `transactionreceipt` (`transaction_id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=807 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `userrating`
--

LOCK TABLES `userrating` WRITE;
/*!40000 ALTER TABLE `userrating` DISABLE KEYS */;
INSERT INTO `userrating` VALUES (801,5,'Smooth transaction, highly recommended!','u5',301),(802,4,'Friendly buyer, item as described.','u1',301),(803,3,'Took long to respond.','u4',302),(804,5,'Great swap experience!','u6',304),(805,2,'Cancelled transaction unexpectedly.','u9',305),(806,5,'Quick payment, very polite.','u8',306);
/*!40000 ALTER TABLE `userrating` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'bidops'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-10-26 19:23:31
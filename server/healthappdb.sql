-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 12, 2026 at 11:26 AM
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
-- Database: `healthappdb`
--

-- --------------------------------------------------------

--
-- Table structure for table `gpusers`
--

CREATE TABLE `gpusers` (
  `gpID` int(10) NOT NULL,
  `username` varchar(30) NOT NULL,
  `email` varchar(50) NOT NULL COMMENT 'ADD EMAIL CONSTRAINTS',
  `password` varchar(50) NOT NULL COMMENT 'HASHED PASSWORD',
  `firstname` varchar(30) NOT NULL,
  `surname` varchar(30) NOT NULL,
  `centre` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `gpusers`
--

INSERT INTO `gpusers` (`gpID`, `username`, `email`, `password`, `firstname`, `surname`, `centre`) VALUES
(1, 'DRJod', 'DRjod@medicalpractice.org', 'password', 'Doctor', 'Jodfrey', 'Jodfrey medical practice');

-- --------------------------------------------------------

--
-- Table structure for table `isgp`
--

CREATE TABLE `isgp` (
  `userID` int(10) NOT NULL,
  `gpID` int(10) NOT NULL,
  `accepted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `isgp`
--

INSERT INTO `isgp` (`userID`, `gpID`, `accepted`) VALUES
(1, 1, 1),
(2, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `userrelationships`
--

CREATE TABLE `userrelationships` (
  `user1` int(11) NOT NULL,
  `user2` int(11) NOT NULL,
  `accepted` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `userrelationships`
--

INSERT INTO `userrelationships` (`user1`, `user2`, `accepted`) VALUES
(1, 2, 1);

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `userID` int(10) NOT NULL COMMENT 'PK',
  `username` varchar(30) NOT NULL,
  `password` varchar(30) NOT NULL,
  `email` varchar(50) NOT NULL COMMENT 'NEEDS CONSTRAINT ADDED',
  `firstname` varchar(30) NOT NULL,
  `surname` varchar(30) NOT NULL,
  `dob` date NOT NULL COMMENT 'DOUBLE CHECK DATE FORMAT FOR QUERIES',
  `weight` float DEFAULT NULL COMMENT 'WEIGHT IN KG, USER INPUT',
  `stepcount` int(6) DEFAULT NULL COMMENT 'USER INPUTTED ',
  `stepgoal` int(6) DEFAULT NULL COMMENT 'USER INPUT',
  `gpID` int(10) DEFAULT NULL COMMENT 'FK (NEEDS ADDED)',
  `kcal` int(5) DEFAULT NULL COMMENT 'RUNNING TOTAL OF USER INPUT',
  `avgRestHR` int(5) DEFAULT NULL COMMENT 'BIOMONITOR INPUT',
  `avgActiveHR` int(5) DEFAULT NULL COMMENT 'BIOMONITOR INPUT',
  `bloodPressure` int(5) DEFAULT NULL COMMENT 'BIOMONITOR INPUT',
  `fluidIntake` int(5) DEFAULT NULL COMMENT 'USER INPUT'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`userID`, `username`, `password`, `email`, `firstname`, `surname`, `dob`, `weight`, `stepcount`, `stepgoal`, `gpID`, `kcal`, `avgRestHR`, `avgActiveHR`, `bloodPressure`, `fluidIntake`) VALUES
(1, 'jodfrey', 'testpassword', 'godfrey@jod.com', 'Ching Kong Godfrey', 'Lam', '2005-07-13', NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL),
(2, 'eg2031', 'testpass', 'eg2031@hw.ac.uk', 'Euan', 'G', '2005-01-15', NULL, NULL, NULL, 1, NULL, NULL, NULL, NULL, NULL),
(3, 'user1', 'password', 'user1email@gmail.com', 'Test1', 'Test1', '2011-01-19', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `gpusers`
--
ALTER TABLE `gpusers`
  ADD PRIMARY KEY (`gpID`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- Indexes for table `isgp`
--
ALTER TABLE `isgp`
  ADD KEY `idx_gpID` (`gpID`),
  ADD KEY `userID` (`userID`);

--
-- Indexes for table `userrelationships`
--
ALTER TABLE `userrelationships`
  ADD PRIMARY KEY (`user1`,`user2`),
  ADD KEY `fk_userid2` (`user2`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`userID`) USING BTREE,
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `gpusers`
--
ALTER TABLE `gpusers`
  MODIFY `gpID` int(10) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `userID` int(10) NOT NULL AUTO_INCREMENT COMMENT 'PK', AUTO_INCREMENT=4;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `isgp`
--
ALTER TABLE `isgp`
  ADD CONSTRAINT `fk_isgp_gp` FOREIGN KEY (`gpID`) REFERENCES `gpusers` (`gpID`),
  ADD CONSTRAINT `fk_isgp_user` FOREIGN KEY (`userID`) REFERENCES `users` (`userID`);

--
-- Constraints for table `userrelationships`
--
ALTER TABLE `userrelationships`
  ADD CONSTRAINT `fk_userid1` FOREIGN KEY (`user1`) REFERENCES `users` (`userID`),
  ADD CONSTRAINT `fk_userid2` FOREIGN KEY (`user2`) REFERENCES `users` (`userID`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

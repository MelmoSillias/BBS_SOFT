-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1
-- Généré le : mer. 17 sep. 2025 à 18:01
-- Version du serveur : 10.4.32-MariaDB
-- Version de PHP : 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `bss_db`
--

-- --------------------------------------------------------

--
-- Structure de la table `account_transaction`
--

CREATE TABLE IF NOT EXISTS `account_transaction` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `describ` varchar(255) NOT NULL,
  `agence_id` int(11) DEFAULT NULL,
  `transfert_id` int(11) DEFAULT NULL,
  `type` varchar(10) DEFAULT NULL,
  `exchange_id` int(11) DEFAULT NULL,
  `cfa` decimal(15,2) DEFAULT NULL,
  `aed` decimal(15,2) DEFAULT NULL,
  `eur` decimal(15,2) DEFAULT NULL,
  `usd` decimal(15,2) DEFAULT NULL,
  `gbp` decimal(15,2) DEFAULT NULL,
  `cny` decimal(15,2) DEFAULT NULL,
  `mad` decimal(15,2) DEFAULT NULL,
  `dzd` decimal(15,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `account_transaction`
--

INSERT INTO `account_transaction` (`id`, `client_id`, `created_at`, `describ`, `agence_id`, `transfert_id`, `type`, `exchange_id`, `cfa`, `aed`, `eur`, `usd`, `gbp`, `cny`, `mad`, `dzd`) VALUES
(83, NULL, '2025-09-02 00:00:00', 'Report du 02', 1, NULL, NULL, 27, -10107476.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(84, NULL, '2025-09-03 00:00:00', 'ARRIVAGE DIGUBA OFFCI', 1, NULL, NULL, 28, -34500000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(85, NULL, '2025-09-03 00:00:00', 'ARRIVAGE OUSMANE DIARRA', 1, NULL, NULL, 29, -17250000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(86, NULL, '2025-09-03 00:00:00', 'ARRIVAGE DIABY', 1, NULL, NULL, 30, -2035500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(87, NULL, '2025-09-03 00:00:00', 'ARRIVAGE BARDJI', 1, NULL, NULL, 31, -18515575.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(88, NULL, '2025-09-02 00:00:00', 'Report du 02', 2, NULL, NULL, 27, NULL, NULL, NULL, 17578.22, NULL, NULL, NULL, NULL),
(89, NULL, '2025-09-03 00:00:00', 'ARRIVAGE DIGUBA OFFCI', 2, NULL, NULL, 28, NULL, NULL, NULL, 60000.00, NULL, NULL, NULL, NULL),
(90, NULL, '2025-09-03 00:00:00', 'ARRIVAGE OUSMANE DIARRA', 2, NULL, NULL, 29, NULL, NULL, NULL, 30000.00, NULL, NULL, NULL, NULL),
(91, NULL, '2025-09-03 00:00:00', 'ARRIVAGE DIABY', 2, NULL, NULL, 30, NULL, NULL, NULL, 3540.00, NULL, NULL, NULL, NULL),
(92, NULL, '2025-09-03 00:00:00', 'ARRIVAGE BARDJI', 2, NULL, NULL, 31, NULL, NULL, NULL, 32201.00, NULL, NULL, NULL, NULL),
(93, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 15, NULL, NULL, 6321692.78, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(94, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 16, NULL, NULL, 1352101.41, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(95, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 17, NULL, NULL, 28850000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(96, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 18, NULL, NULL, 55468.80, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(97, 2, '2025-09-04 19:11:17', 'Depot 10000000 CFA', NULL, NULL, 'Versement', NULL, 10000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(98, NULL, '2025-09-04 19:11:17', 'Depot 10000000 CFA compte KEBRI', 1, NULL, NULL, NULL, 10000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(99, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 21, NULL, NULL, 24759.07, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(101, NULL, '2025-09-03 00:00:00', 'Transfert effectué par cash', 1, 23, NULL, NULL, 9715122.10, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(103, 3, '2025-09-04 19:29:47', 'Depot 1000000 CFA', NULL, NULL, 'Versement', NULL, 1000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(104, NULL, '2025-09-04 19:29:47', 'Depot 1000000 CFA compte SY MODY', 1, NULL, NULL, NULL, 1000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(105, NULL, '2025-09-03 00:00:00', 'Transfert -- CHEICK TIDIANE -- 10956.14 USD', 2, 15, NULL, NULL, NULL, NULL, NULL, -10956.14, NULL, NULL, NULL, NULL),
(106, NULL, '2025-09-03 00:00:00', 'Transfert -- SIMPARA -- 2343.33 USD', 2, 16, NULL, NULL, NULL, NULL, NULL, -2343.33, NULL, NULL, NULL, NULL),
(107, NULL, '2025-09-03 00:00:00', 'Transfert -- TAHIROU -- 50000.00 USD', 2, 17, NULL, NULL, NULL, NULL, NULL, -50000.00, NULL, NULL, NULL, NULL),
(108, NULL, '2025-09-03 00:00:00', 'Transfert -- BADRA -- 94.40 USD', 2, 18, NULL, NULL, NULL, NULL, NULL, -94.40, NULL, NULL, NULL, NULL),
(109, NULL, '2025-09-03 00:00:00', 'Transfert -- KEBRI -- 8174.39 USD', 2, 19, NULL, NULL, NULL, NULL, NULL, -8174.39, NULL, NULL, NULL, NULL),
(110, 2, '2025-09-03 00:00:00', 'Retrait compte - KEBRI', NULL, 19, NULL, NULL, -4716623.03, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(111, NULL, '2025-09-03 00:00:00', 'Transfert -- KEBRI -- 4087.20 USD', 2, 20, NULL, NULL, NULL, NULL, NULL, -4087.20, NULL, NULL, NULL, NULL),
(112, 2, '2025-09-03 00:00:00', 'Retrait compte - KEBRI', NULL, 20, NULL, NULL, -2358314.40, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(113, NULL, '2025-09-03 00:00:00', 'Transfert -- BADRA -- 42.91 USD', 2, 21, NULL, NULL, NULL, NULL, NULL, -42.91, NULL, NULL, NULL, NULL),
(115, NULL, '2025-09-03 00:00:00', 'Transfert -- KAOU SAOURE -- 16837.30 USD', 2, 23, NULL, NULL, NULL, NULL, NULL, -16837.30, NULL, NULL, NULL, NULL),
(117, NULL, '2025-09-04 00:00:00', 'ACHAT DOLLAR', 1, NULL, NULL, 32, -288500.00, NULL, NULL, 500.00, NULL, NULL, NULL, NULL),
(119, NULL, '2025-09-04 00:00:00', 'Dépense: PAIEMENT FACTURE D\'EAU', 1, NULL, NULL, NULL, -15000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(120, NULL, '2025-09-06 00:00:00', 'Transfert effectué par cash', 1, 25, NULL, NULL, 620500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(121, NULL, '2025-09-06 00:00:00', 'Transfert -- TEST -- 1102.07 USD', 2, 25, NULL, NULL, NULL, NULL, NULL, -1102.07, NULL, NULL, NULL, NULL),
(123, NULL, '2025-09-13 19:18:42', 'test', 1, NULL, NULL, NULL, -10000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(124, NULL, '2025-09-15 00:00:00', 'Transfert effectué par cash', 1, 27, NULL, NULL, 2000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(125, NULL, '2025-09-15 00:00:00', 'Envoi cash - test', 1, 26, NULL, NULL, 100000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(126, NULL, '2025-09-15 00:00:00', 'Transfert -- KEBRI -- 8887.62 USD', 2, 28, NULL, NULL, NULL, NULL, NULL, -8887.62, NULL, NULL, NULL, NULL),
(127, 2, '2025-09-15 00:00:00', 'Retrait compte - KEBRI', NULL, 28, NULL, NULL, -5000000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(128, NULL, '2025-09-15 00:00:00', 'Transfert -- test2 -- 3555.05 USD', 2, 27, NULL, NULL, NULL, NULL, NULL, -3555.05, NULL, NULL, NULL, NULL),
(133, NULL, '2025-09-16 00:00:00', 'Transfert effectué par cash - SY MODY', 1, 29, NULL, NULL, 200000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(135, NULL, '2025-09-17 00:00:00', 'Approvisionnement: REGULARISATION DU SOLDE', 1, NULL, NULL, NULL, 3000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(137, NULL, '2025-09-16 00:00:00', 'Transfert effectué par cash - SY MODY', 1, 30, NULL, NULL, 5000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(138, NULL, '2025-09-17 00:00:00', 'Transfert -- SY MODY -- 355.50 USD', 2, 29, NULL, NULL, NULL, NULL, NULL, -355.50, NULL, NULL, NULL, NULL),
(139, NULL, '2025-09-17 00:00:00', 'Transfert -- SY MODY -- 8.89 USD', 2, 30, NULL, NULL, NULL, NULL, NULL, -8.89, NULL, NULL, NULL, NULL),
(140, 3, '2025-09-17 17:32:30', 'vente de USD à BAMAKO sur compte', NULL, NULL, NULL, 34, 565000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(141, NULL, '2025-09-17 17:32:30', 'vente de USD sur compte SY MODY', 1, NULL, NULL, 34, NULL, NULL, NULL, 1000.00, NULL, NULL, NULL, NULL),
(142, 3, '2025-09-17 17:33:41', 'vente de USD à BAMAKO sur compte', NULL, NULL, NULL, 35, 56500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(143, NULL, '2025-09-17 17:33:41', 'vente de USD sur compte SY MODY', 1, NULL, NULL, 35, NULL, NULL, NULL, 100.00, NULL, NULL, NULL, NULL),
(144, 2, '2025-09-17 17:35:15', 'Depot 2000 CFA', NULL, NULL, 'Versement', NULL, 2000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(145, NULL, '2025-09-17 17:35:15', 'Depot 2000 CFA compte KEBRI', 1, NULL, NULL, NULL, 2000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(146, 3, '2025-09-17 17:41:17', 'achat de USD à BAMAKO sur compte', NULL, NULL, NULL, 36, -3275000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(147, NULL, '2025-09-17 17:41:17', 'achat de USD sur compte SY MODY', 1, NULL, NULL, 36, NULL, NULL, NULL, -5000.00, NULL, NULL, NULL, NULL),
(148, 2, '2025-09-17 17:43:17', 'vente de USD à Dubaï sur compte', NULL, NULL, NULL, 37, 10000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(149, NULL, '2025-09-17 17:43:17', 'vente de USD sur compte KEBRI', 2, NULL, NULL, NULL, NULL, NULL, NULL, 5000.00, NULL, NULL, NULL, NULL),
(150, 3, '2025-09-17 17:45:27', 'vente de USD à Dubaï sur compte', NULL, NULL, NULL, 38, 32750000.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(151, NULL, '2025-09-17 17:45:27', 'vente de USD sur compte SY MODY', 2, NULL, NULL, NULL, NULL, NULL, NULL, 50000.00, NULL, NULL, NULL, NULL),
(152, 3, '2025-09-17 17:46:53', 'vente de USD à Dubaï sur compte', NULL, NULL, NULL, 39, 327500.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(153, NULL, '2025-09-17 17:46:53', 'vente de USD sur compte SY MODY', 2, NULL, NULL, NULL, NULL, NULL, NULL, 500.00, NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `agence`
--

CREATE TABLE IF NOT EXISTS `agence` (
  `id` int(11) NOT NULL,
  `designation` varchar(255) NOT NULL,
  `localite` varchar(255) NOT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `is_active` tinyint(1) NOT NULL,
  `abg` varchar(5) NOT NULL,
  `devise_local` varchar(5) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `agence`
--

INSERT INTO `agence` (`id`, `designation`, `localite`, `created_at`, `is_active`, `abg`, `devise_local`) VALUES
(1, 'BAMAKO', 'MALI', '2025-08-08 15:48:31', 1, 'ML', 'CFA'),
(2, 'Dubaï', 'Emirates-Arabes-Unis', '2025-08-29 16:19:45', 1, 'EAU', 'AED'),
(3, 'Paris', 'France', '2025-08-29 16:19:45', 1, 'FR', 'EUR'),
(4, 'Washington D.C.', 'États-Unis', '2025-08-29 16:19:45', 1, 'USA', 'USD'),
(5, 'Londres', 'Royaume-Uni', '2025-08-29 16:19:45', 1, 'UK', 'GBP'),
(6, 'Pékin', 'Chine', '2025-08-29 16:19:45', 1, 'CHI', 'CNY'),
(7, 'Rabat', 'Maroc', '2025-08-29 16:19:45', 1, 'MRC', 'MAD'),
(8, 'Alger', 'Algérie', '2025-08-29 16:19:45', 1, 'ALG', 'DZD');

-- --------------------------------------------------------

--
-- Structure de la table `approvisionnement`
--

CREATE TABLE IF NOT EXISTS `approvisionnement` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `date` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `motif` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `note` varchar(255) DEFAULT NULL,
  `ref` varchar(25) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `approvisionnement`
--

INSERT INTO `approvisionnement` (`id`, `user_id`, `transaction_id`, `date`, `motif`, `type`, `montant`, `note`, `ref`) VALUES
(1, 1, 135, '2025-09-17 00:00:00', 'REGULARISATION DU SOLDE', 'service', 3000.00, '', 'BSS-A001');

-- --------------------------------------------------------

--
-- Structure de la table `client`
--

CREATE TABLE IF NOT EXISTS `client` (
  `id` int(11) NOT NULL,
  `nom_complet` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `phone_number` varchar(255) NOT NULL,
  `is_active` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `client`
--

INSERT INTO `client` (`id`, `nom_complet`, `address`, `phone_number`, `is_active`) VALUES
(2, 'KEBRI', '', '00 00 00 00 ', 1),
(3, 'SY MODY', '', '', 1);

-- --------------------------------------------------------

--
-- Structure de la table `depense`
--

CREATE TABLE IF NOT EXISTS `depense` (
  `id` int(11) NOT NULL,
  `user_id` int(11) DEFAULT NULL,
  `transaction_id` int(11) DEFAULT NULL,
  `date` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `motif` varchar(255) NOT NULL,
  `type` varchar(255) NOT NULL,
  `montant` decimal(10,2) NOT NULL,
  `note` varchar(255) NOT NULL,
  `ref` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `depense`
--

INSERT INTO `depense` (`id`, `user_id`, `transaction_id`, `date`, `motif`, `type`, `montant`, `note`, `ref`) VALUES
(2, 1, 119, '2025-09-04 00:00:00', 'PAIEMENT FACTURE D\'EAU', 'autres', 15000.00, '', '');

-- --------------------------------------------------------

--
-- Structure de la table `doctrine_migration_versions`
--

CREATE TABLE IF NOT EXISTS `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8 COLLATE=utf8_unicode_ci;

--
-- Déchargement des données de la table `doctrine_migration_versions`
--

INSERT INTO `doctrine_migration_versions` (`version`, `executed_at`, `execution_time`) VALUES
('DoctrineMigrations\\Version20250901212304', '2025-09-01 23:23:07', 64),
('DoctrineMigrations\\Version20250902011532', '2025-09-02 03:15:36', 41),
('DoctrineMigrations\\Version20250903163240', '2025-09-03 18:32:52', 110),
('DoctrineMigrations\\Version20250910182436', '2025-09-10 20:25:06', 245),
('DoctrineMigrations\\Version20250916172139', '2025-09-16 19:22:00', 18);

-- --------------------------------------------------------

--
-- Structure de la table `exchange`
--

CREATE TABLE IF NOT EXISTS `exchange` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `taux` decimal(10,5) NOT NULL,
  `description` varchar(255) NOT NULL,
  `vanish_client_name` varchar(255) DEFAULT NULL,
  `vanish_client_tel` varchar(255) DEFAULT NULL,
  `date` datetime DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
  `type` varchar(10) NOT NULL,
  `devise` varchar(5) NOT NULL,
  `montant_devise` decimal(15,2) NOT NULL,
  `montant_cfa` decimal(15,2) NOT NULL,
  `ref` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `exchange`
--

INSERT INTO `exchange` (`id`, `client_id`, `taux`, `description`, `vanish_client_name`, `vanish_client_tel`, `date`, `type`, `devise`, `montant_devise`, `montant_cfa`, `ref`) VALUES
(27, NULL, 575.00000, 'Report du 02', NULL, NULL, '2025-09-02 00:00:00', 'achat', 'USD', 17578.22, 10107476.50, NULL),
(28, NULL, 575.00000, 'ARRIVAGE DIGUBA OFFCI', NULL, NULL, '2025-09-03 00:00:00', 'achat', 'USD', 60000.00, 34500000.00, NULL),
(29, NULL, 575.00000, 'ARRIVAGE OUSMANE DIARRA', NULL, NULL, '2025-09-03 00:00:00', 'achat', 'USD', 30000.00, 17250000.00, NULL),
(30, NULL, 575.00000, 'ARRIVAGE DIABY', NULL, NULL, '2025-09-03 00:00:00', 'achat', 'USD', 3540.00, 2035500.00, NULL),
(31, NULL, 575.00000, 'ARRIVAGE BARDJI', NULL, NULL, '2025-09-03 00:00:00', 'achat', 'USD', 32201.00, 18515575.00, NULL),
(32, NULL, 577.00000, 'ACHAT DOLLAR', NULL, NULL, '2025-09-04 00:00:00', 'achat', 'USD', 500.00, 288500.00, NULL),
(34, 3, 565.00000, 'vente de USD à BAMAKO sur compte', NULL, NULL, '2025-09-17 17:32:30', 'vente', 'USD', 1000.00, 565000.00, NULL),
(35, 3, 565.00000, 'vente de USD à BAMAKO sur compte', NULL, NULL, '2025-09-17 17:33:41', 'vente', 'USD', 100.00, 56500.00, NULL),
(36, 3, 655.00000, 'achat de USD à BAMAKO sur compte', NULL, NULL, '2025-09-17 17:41:17', 'achat', 'USD', 5000.00, 3275000.00, NULL),
(37, 2, 2.00000, 'vente de USD à Dubaï sur compte', NULL, NULL, '2025-09-17 17:43:17', 'vente', 'USD', 5000.00, 10000.00, NULL),
(38, 3, 655.00000, 'vente de USD à Dubaï sur compte', NULL, NULL, '2025-09-17 17:45:27', 'vente', 'USD', 50000.00, 32750000.00, NULL),
(39, 3, 655.00000, 'vente de USD à Dubaï sur compte', NULL, NULL, '2025-09-17 17:46:53', 'vente', 'USD', 500.00, 327500.00, NULL);

-- --------------------------------------------------------

--
-- Structure de la table `messenger_messages`
--

CREATE TABLE IF NOT EXISTS `messenger_messages` (
  `id` bigint(20) NOT NULL,
  `body` longtext NOT NULL,
  `headers` longtext NOT NULL,
  `queue_name` varchar(190) NOT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `available_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `delivered_at` datetime DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `transfert`
--

CREATE TABLE IF NOT EXISTS `transfert` (
  `id` int(11) NOT NULL,
  `client_id` int(11) DEFAULT NULL,
  `created_at` datetime NOT NULL COMMENT '(DC2Type:datetime_immutable)',
  `type` varchar(55) NOT NULL,
  `montant_cfa` decimal(10,2) NOT NULL,
  `montant_reception` decimal(10,2) NOT NULL,
  `taux` decimal(10,5) NOT NULL,
  `frais` decimal(10,2) NOT NULL,
  `receiver_name` varchar(255) NOT NULL,
  `receiver_phone` varchar(255) NOT NULL,
  `status` varchar(55) NOT NULL,
  `updated_at` datetime DEFAULT NULL COMMENT '(DC2Type:datetime_immutable)',
  `ref` varchar(10) NOT NULL,
  `montant_usd` decimal(10,2) NOT NULL,
  `sender_name` varchar(255) DEFAULT NULL,
  `sender_phone` varchar(255) DEFAULT NULL,
  `agence_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `transfert`
--

INSERT INTO `transfert` (`id`, `client_id`, `created_at`, `type`, `montant_cfa`, `montant_reception`, `taux`, `frais`, `receiver_name`, `receiver_phone`, `status`, `updated_at`, `ref`, `montant_usd`, `sender_name`, `sender_phone`, `agence_id`) VALUES
(15, NULL, '2025-09-03 00:00:00', 'standard', 6321692.78, 40209.03, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:40:19', 'CHE2509001', 10956.14, 'CHEICK TIDIANE', '', 2),
(16, NULL, '2025-09-03 00:00:00', 'standard', 1352101.41, 8600.02, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:41:34', 'SIM2509002', 2343.33, 'SIMPARA', '', 2),
(17, NULL, '2025-09-03 00:00:00', 'standard', 28850000.00, 183500.00, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:41:41', 'TAH2509003', 50000.00, 'TAHIROU', '', 2),
(18, NULL, '2025-09-03 00:00:00', 'standard', 54468.80, 346.45, 577.00000, 1000.00, '', '', 'completed', '2025-09-04 19:41:56', 'BAD2509004', 94.40, 'BADRA', '', 2),
(19, 2, '2025-09-03 00:00:00', 'byAccount', 4716623.03, 30000.01, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:42:05', 'KEB2509005', 8174.39, NULL, NULL, 2),
(20, 2, '2025-09-03 00:00:00', 'byAccount', 2358314.40, 15000.02, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:42:12', 'KEB2509006', 4087.20, NULL, NULL, 2),
(21, NULL, '2025-09-03 00:00:00', 'standard', 24759.07, 157.48, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:43:19', 'BAD2509007', 42.91, 'BADRA', '', 2),
(23, NULL, '2025-09-03 00:00:00', 'standard', 9715122.10, 61792.89, 577.00000, 0.00, '', '', 'completed', '2025-09-04 19:43:38', 'KAO2509009', 16837.30, 'KAOU SAOURE', '', 2),
(25, NULL, '2025-09-06 00:00:00', 'standard', 620000.00, 4044.58, 562.58000, 500.00, 'TEST', '', 'completed', '2025-09-06 23:59:38', 'TES2509011', 1102.07, 'TEST', '', 2),
(26, NULL, '2025-09-15 00:00:00', 'standard', 100000.00, 652.35, 562.58000, 0.00, '', '', 'processing', '2025-09-15 00:00:00', 'TES2509012', 177.75, 'test', '', 2),
(27, NULL, '2025-09-15 00:00:00', 'standard', 2000000.00, 13047.03, 562.58000, 0.00, '', '', 'completed', '2025-09-15 18:44:43', 'TES2509013', 3555.05, 'test2', 'test', 2),
(28, 2, '2025-09-15 00:00:00', 'byAccount', 5000000.00, 32617.58, 562.58000, 0.00, '', '', 'completed', '2025-09-15 18:34:05', 'KEB2509014', 8887.62, NULL, NULL, 2),
(29, 3, '2025-09-16 00:00:00', 'standard', 200000.00, 1304.70, 562.58000, 0.00, 'IBRAHIM', 'zafzef', 'completed', '2025-09-17 12:31:44', 'BSS-T013', 355.50, NULL, NULL, 2),
(30, 3, '2025-09-16 00:00:00', 'standard', 5000.00, 32.62, 562.58000, 0.00, 'IBRAHIM', 'zafzef', 'completed', '2025-09-17 12:32:36', 'BSS-T014', 8.89, ',kwb', 'smlb,ldn', 2);

-- --------------------------------------------------------

--
-- Structure de la table `user`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL,
  `username` varchar(180) NOT NULL,
  `roles` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL COMMENT '(DC2Type:json)' CHECK (json_valid(`roles`)),
  `password` varchar(255) NOT NULL,
  `is_actif` tinyint(1) NOT NULL,
  `full_name` varchar(255) NOT NULL,
  `theme` varchar(10) NOT NULL DEFAULT 'light'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `user`
--

INSERT INTO `user` (`id`, `username`, `roles`, `password`, `is_actif`, `full_name`, `theme`) VALUES
(1, 'Admin', '[\"ROLE_ADMIN\",\"ROLE_USER\",\"ROLE_DASHBOARD\",\"ROLE_CLIENTS\",\"ROLE_TRANSFERTS\",\"ROLE_EXCHANGE\", \"ROLE_EXPENSES\",\"ROLE_REPORT\",\"ROLE_USERS\"]', '$2y$13$4ZuZKqLHXrjxKvJkJKfBu.oAvrIN/3IVQKyS.M9VRm2jeReISg.gi', 1, 'Administrateur', 'light');

--
-- Index pour les tables déchargées
--

--
-- Index pour la table `account_transaction`
--
ALTER TABLE `account_transaction`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_A370F9D219EB6921` (`client_id`),
  ADD KEY `IDX_A370F9D2D725330D` (`agence_id`),
  ADD KEY `IDX_A370F9D23C9C4BAD` (`transfert_id`),
  ADD KEY `IDX_A370F9D268AFD1A0` (`exchange_id`);

--
-- Index pour la table `agence`
--
ALTER TABLE `agence`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_516C3FAA2FC0CB0F` (`transaction_id`),
  ADD KEY `IDX_516C3FAAA76ED395` (`user_id`);

--
-- Index pour la table `client`
--
ALTER TABLE `client`
  ADD PRIMARY KEY (`id`);

--
-- Index pour la table `depense`
--
ALTER TABLE `depense`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_340597572FC0CB0F` (`transaction_id`),
  ADD KEY `IDX_34059757A76ED395` (`user_id`);

--
-- Index pour la table `doctrine_migration_versions`
--
ALTER TABLE `doctrine_migration_versions`
  ADD PRIMARY KEY (`version`);

--
-- Index pour la table `exchange`
--
ALTER TABLE `exchange`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_D33BB07919EB6921` (`client_id`);

--
-- Index pour la table `messenger_messages`
--
ALTER TABLE `messenger_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_75EA56E0FB7336F0` (`queue_name`),
  ADD KEY `IDX_75EA56E0E3BD61CE` (`available_at`),
  ADD KEY `IDX_75EA56E016BA31DB` (`delivered_at`);

--
-- Index pour la table `transfert`
--
ALTER TABLE `transfert`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_1E4EACBB19EB6921` (`client_id`),
  ADD KEY `IDX_1E4EACBBD725330D` (`agence_id`);

--
-- Index pour la table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_IDENTIFIER_USERNAME` (`username`);

--
-- AUTO_INCREMENT pour les tables déchargées
--

--
-- AUTO_INCREMENT pour la table `account_transaction`
--
ALTER TABLE `account_transaction`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=154;

--
-- AUTO_INCREMENT pour la table `agence`
--
ALTER TABLE `agence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT pour la table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT pour la table `client`
--
ALTER TABLE `client`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT pour la table `depense`
--
ALTER TABLE `depense`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT pour la table `exchange`
--
ALTER TABLE `exchange`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=40;

--
-- AUTO_INCREMENT pour la table `messenger_messages`
--
ALTER TABLE `messenger_messages`
  MODIFY `id` bigint(20) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT pour la table `transfert`
--
ALTER TABLE `transfert`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=31;

--
-- AUTO_INCREMENT pour la table `user`
--
ALTER TABLE `user`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- Contraintes pour les tables déchargées
--

--
-- Contraintes pour la table `account_transaction`
--
ALTER TABLE `account_transaction`
  ADD CONSTRAINT `FK_A370F9D219EB6921` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`),
  ADD CONSTRAINT `FK_A370F9D23C9C4BAD` FOREIGN KEY (`transfert_id`) REFERENCES `transfert` (`id`),
  ADD CONSTRAINT `FK_A370F9D268AFD1A0` FOREIGN KEY (`exchange_id`) REFERENCES `exchange` (`id`),
  ADD CONSTRAINT `FK_A370F9D2D725330D` FOREIGN KEY (`agence_id`) REFERENCES `agence` (`id`);

--
-- Contraintes pour la table `approvisionnement`
--
ALTER TABLE `approvisionnement`
  ADD CONSTRAINT `FK_516C3FAA2FC0CB0F` FOREIGN KEY (`transaction_id`) REFERENCES `account_transaction` (`id`),
  ADD CONSTRAINT `FK_516C3FAAA76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Contraintes pour la table `depense`
--
ALTER TABLE `depense`
  ADD CONSTRAINT `FK_340597572FC0CB0F` FOREIGN KEY (`transaction_id`) REFERENCES `account_transaction` (`id`),
  ADD CONSTRAINT `FK_34059757A76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`);

--
-- Contraintes pour la table `exchange`
--
ALTER TABLE `exchange`
  ADD CONSTRAINT `FK_D33BB07919EB6921` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`);

--
-- Contraintes pour la table `transfert`
--
ALTER TABLE `transfert`
  ADD CONSTRAINT `FK_1E4EACBB19EB6921` FOREIGN KEY (`client_id`) REFERENCES `client` (`id`),
  ADD CONSTRAINT `FK_1E4EACBBD725330D` FOREIGN KEY (`agence_id`) REFERENCES `agence` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

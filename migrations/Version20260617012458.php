<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20260617012458 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('CREATE TABLE account_transaction (id INT AUTO_INCREMENT NOT NULL, client_id INT DEFAULT NULL, exchange_id INT DEFAULT NULL, agence_id INT DEFAULT NULL, transfert_id INT DEFAULT NULL, linked_transaction_id INT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', describ VARCHAR(255) NOT NULL, cfa NUMERIC(15, 2) DEFAULT NULL, aed NUMERIC(15, 2) DEFAULT NULL, eur NUMERIC(15, 2) DEFAULT NULL, usd NUMERIC(15, 2) DEFAULT NULL, gbp NUMERIC(15, 2) DEFAULT NULL, cny NUMERIC(15, 2) DEFAULT NULL, mad NUMERIC(15, 2) DEFAULT NULL, dzd NUMERIC(15, 2) DEFAULT NULL, type VARCHAR(10) DEFAULT NULL, INDEX IDX_A370F9D219EB6921 (client_id), INDEX IDX_A370F9D268AFD1A0 (exchange_id), INDEX IDX_A370F9D2D725330D (agence_id), INDEX IDX_A370F9D23C9C4BAD (transfert_id), INDEX IDX_A370F9D2692265F7 (linked_transaction_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE agence (id INT AUTO_INCREMENT NOT NULL, designation VARCHAR(255) NOT NULL, localite VARCHAR(255) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', is_active TINYINT(1) NOT NULL, abg VARCHAR(5) NOT NULL, devise_local VARCHAR(5) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE approvisionnement (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, transaction_id INT DEFAULT NULL, date DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', motif VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, montant NUMERIC(10, 2) NOT NULL, note VARCHAR(255) DEFAULT NULL, ref VARCHAR(25) DEFAULT NULL, INDEX IDX_516C3FAAA76ED395 (user_id), UNIQUE INDEX UNIQ_516C3FAA2FC0CB0F (transaction_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE client (id INT AUTO_INCREMENT NOT NULL, nom_complet VARCHAR(255) NOT NULL, address VARCHAR(255) NOT NULL, phone_number VARCHAR(255) NOT NULL, is_active TINYINT(1) NOT NULL, PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE depense (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, transaction_id INT DEFAULT NULL, date DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', motif VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, montant NUMERIC(10, 2) NOT NULL, note VARCHAR(255) NOT NULL, ref VARCHAR(25) NOT NULL, INDEX IDX_34059757A76ED395 (user_id), UNIQUE INDEX UNIQ_340597572FC0CB0F (transaction_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE exchange (id INT AUTO_INCREMENT NOT NULL, client_id INT DEFAULT NULL, devise VARCHAR(5) NOT NULL, montant_devise NUMERIC(15, 2) NOT NULL, montant_cfa NUMERIC(15, 2) NOT NULL, taux NUMERIC(12, 6) NOT NULL, description VARCHAR(255) NOT NULL, vanish_client_name VARCHAR(255) DEFAULT NULL, vanish_client_tel VARCHAR(255) DEFAULT NULL, date DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', type VARCHAR(10) NOT NULL, ref VARCHAR(255) DEFAULT NULL, INDEX IDX_D33BB07919EB6921 (client_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE transfert (id INT AUTO_INCREMENT NOT NULL, client_id INT DEFAULT NULL, agence_id INT NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', type VARCHAR(55) NOT NULL, montant_cfa NUMERIC(18, 2) NOT NULL, montant_usd NUMERIC(18, 2) NOT NULL, taux NUMERIC(10, 6) NOT NULL, frais NUMERIC(10, 2) NOT NULL, sender_name VARCHAR(255) DEFAULT NULL, sender_actual_name VARCHAR(255) DEFAULT NULL, sender_phone VARCHAR(255) DEFAULT NULL, receiver_name VARCHAR(255) NOT NULL, receiver_phone VARCHAR(255) NOT NULL, montant_reception NUMERIC(10, 2) NOT NULL, status VARCHAR(55) NOT NULL, updated_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', ref VARCHAR(10) NOT NULL, motif VARCHAR(255) DEFAULT NULL, INDEX IDX_1E4EACBB19EB6921 (client_id), INDEX IDX_1E4EACBBD725330D (agence_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE user (id INT AUTO_INCREMENT NOT NULL, username VARCHAR(180) NOT NULL, roles JSON NOT NULL COMMENT \'(DC2Type:json)\', password VARCHAR(255) NOT NULL, is_actif TINYINT(1) NOT NULL, full_name VARCHAR(255) NOT NULL, theme VARCHAR(10) DEFAULT \'light\' NOT NULL, UNIQUE INDEX UNIQ_IDENTIFIER_USERNAME (username), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('CREATE TABLE messenger_messages (id BIGINT AUTO_INCREMENT NOT NULL, body LONGTEXT NOT NULL, headers LONGTEXT NOT NULL, queue_name VARCHAR(190) NOT NULL, created_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', available_at DATETIME NOT NULL COMMENT \'(DC2Type:datetime_immutable)\', delivered_at DATETIME DEFAULT NULL COMMENT \'(DC2Type:datetime_immutable)\', INDEX IDX_75EA56E0FB7336F0 (queue_name), INDEX IDX_75EA56E0E3BD61CE (available_at), INDEX IDX_75EA56E016BA31DB (delivered_at), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D219EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D268AFD1A0 FOREIGN KEY (exchange_id) REFERENCES exchange (id)');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D2D725330D FOREIGN KEY (agence_id) REFERENCES agence (id)');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D23C9C4BAD FOREIGN KEY (transfert_id) REFERENCES transfert (id)');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D2692265F7 FOREIGN KEY (linked_transaction_id) REFERENCES account_transaction (id)');
        $this->addSql('ALTER TABLE approvisionnement ADD CONSTRAINT FK_516C3FAAA76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE approvisionnement ADD CONSTRAINT FK_516C3FAA2FC0CB0F FOREIGN KEY (transaction_id) REFERENCES account_transaction (id)');
        $this->addSql('ALTER TABLE depense ADD CONSTRAINT FK_34059757A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)');
        $this->addSql('ALTER TABLE depense ADD CONSTRAINT FK_340597572FC0CB0F FOREIGN KEY (transaction_id) REFERENCES account_transaction (id)');
        $this->addSql('ALTER TABLE exchange ADD CONSTRAINT FK_D33BB07919EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB19EB6921 FOREIGN KEY (client_id) REFERENCES client (id)');
        $this->addSql('ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBBD725330D FOREIGN KEY (agence_id) REFERENCES agence (id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D219EB6921');
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D268AFD1A0');
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D2D725330D');
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D23C9C4BAD');
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D2692265F7');
        $this->addSql('ALTER TABLE approvisionnement DROP FOREIGN KEY FK_516C3FAAA76ED395');
        $this->addSql('ALTER TABLE approvisionnement DROP FOREIGN KEY FK_516C3FAA2FC0CB0F');
        $this->addSql('ALTER TABLE depense DROP FOREIGN KEY FK_34059757A76ED395');
        $this->addSql('ALTER TABLE depense DROP FOREIGN KEY FK_340597572FC0CB0F');
        $this->addSql('ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB07919EB6921');
        $this->addSql('ALTER TABLE transfert DROP FOREIGN KEY FK_1E4EACBB19EB6921');
        $this->addSql('ALTER TABLE transfert DROP FOREIGN KEY FK_1E4EACBBD725330D');
        $this->addSql('DROP TABLE account_transaction');
        $this->addSql('DROP TABLE agence');
        $this->addSql('DROP TABLE approvisionnement');
        $this->addSql('DROP TABLE client');
        $this->addSql('DROP TABLE depense');
        $this->addSql('DROP TABLE exchange');
        $this->addSql('DROP TABLE transfert');
        $this->addSql('DROP TABLE user');
        $this->addSql('DROP TABLE messenger_messages');
    }
}

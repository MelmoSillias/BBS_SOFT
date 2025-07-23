<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250722105852 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE transfert (id INT AUTO_INCREMENT NOT NULL, client_id INT DEFAULT NULL, created_at DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', type VARCHAR(55) NOT NULL, destination VARCHAR(255) NOT NULL, montant_cash NUMERIC(10, 0) NOT NULL, devise_cash VARCHAR(8) NOT NULL, montant_reception NUMERIC(10, 0) NOT NULL, devise_reception VARCHAR(8) NOT NULL, taux NUMERIC(10, 0) NOT NULL, frais NUMERIC(10, 0) NOT NULL, vanish_client_name VARCHAR(255) DEFAULT NULL, vanish_client_phone VARCHAR(255) DEFAULT NULL, receiver_name VARCHAR(255) NOT NULL, receiver_phone VARCHAR(255) NOT NULL, taux_devise_reception NUMERIC(10, 0) NOT NULL, INDEX IDX_1E4EACBB19EB6921 (client_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE transfert ADD CONSTRAINT FK_1E4EACBB19EB6921 FOREIGN KEY (client_id) REFERENCES client (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE transfert DROP FOREIGN KEY FK_1E4EACBB19EB6921
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE transfert
        SQL);
    }
}

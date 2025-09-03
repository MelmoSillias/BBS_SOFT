<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250903163240 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            CREATE TABLE depense (id INT AUTO_INCREMENT NOT NULL, user_id INT DEFAULT NULL, transaction_id INT DEFAULT NULL, date DATETIME NOT NULL COMMENT '(DC2Type:datetime_immutable)', motif VARCHAR(255) NOT NULL, type VARCHAR(255) NOT NULL, montant NUMERIC(10, 2) NOT NULL, note VARCHAR(255) NOT NULL, INDEX IDX_34059757A76ED395 (user_id), UNIQUE INDEX UNIQ_340597572FC0CB0F (transaction_id), PRIMARY KEY(id)) DEFAULT CHARACTER SET utf8mb4 COLLATE `utf8mb4_unicode_ci` ENGINE = InnoDB
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE depense ADD CONSTRAINT FK_34059757A76ED395 FOREIGN KEY (user_id) REFERENCES user (id)
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE depense ADD CONSTRAINT FK_340597572FC0CB0F FOREIGN KEY (transaction_id) REFERENCES account_transaction (id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE depense DROP FOREIGN KEY FK_34059757A76ED395
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE depense DROP FOREIGN KEY FK_340597572FC0CB0F
        SQL);
        $this->addSql(<<<'SQL'
            DROP TABLE depense
        SQL);
    }
}

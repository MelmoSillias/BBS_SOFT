<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250930202555 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE account_transaction ADD linked_transaction_id INT DEFAULT NULL');
        $this->addSql('ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D2692265F7 FOREIGN KEY (linked_transaction_id) REFERENCES account_transaction (id)');
        $this->addSql('CREATE INDEX IDX_A370F9D2692265F7 ON account_transaction (linked_transaction_id)');
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql('ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D2692265F7');
        $this->addSql('DROP INDEX IDX_A370F9D2692265F7 ON account_transaction');
        $this->addSql('ALTER TABLE account_transaction DROP linked_transaction_id');
    }
}

<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250901212304 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction ADD exchange_id INT DEFAULT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction ADD CONSTRAINT FK_A370F9D268AFD1A0 FOREIGN KEY (exchange_id) REFERENCES exchange (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_A370F9D268AFD1A0 ON account_transaction (exchange_id)
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction DROP FOREIGN KEY FK_A370F9D268AFD1A0
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_A370F9D268AFD1A0 ON account_transaction
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction DROP exchange_id
        SQL);
    }
}

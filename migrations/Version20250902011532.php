<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Auto-generated Migration: Please modify to your needs!
 */
final class Version20250902011532 extends AbstractMigration
{
    public function getDescription(): string
    {
        return '';
    }

    public function up(Schema $schema): void
    {
        // this up() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction ADD cfa NUMERIC(15, 2) DEFAULT NULL, ADD aed NUMERIC(15, 2) DEFAULT NULL, ADD eur NUMERIC(15, 2) DEFAULT NULL, ADD usd NUMERIC(15, 2) DEFAULT NULL, ADD gbp NUMERIC(15, 2) DEFAULT NULL, ADD cny NUMERIC(15, 2) DEFAULT NULL, ADD mad NUMERIC(15, 2) DEFAULT NULL, ADD dzd NUMERIC(15, 2) DEFAULT NULL, DROP income, DROP outcome, DROP devise
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE exchange DROP FOREIGN KEY FK_D33BB079D725330D
        SQL);
        $this->addSql(<<<'SQL'
            DROP INDEX IDX_D33BB079D725330D ON exchange
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE exchange ADD devise VARCHAR(5) NOT NULL, ADD montant_devise NUMERIC(15, 2) NOT NULL, ADD montant_cfa NUMERIC(15, 2) NOT NULL, DROP agence_id, DROP from_currency, DROP to_currency, DROP from_amount, DROP to_amount
        SQL);
    }

    public function down(Schema $schema): void
    {
        // this down() migration is auto-generated, please modify it to your needs
        $this->addSql(<<<'SQL'
            ALTER TABLE account_transaction ADD income NUMERIC(10, 2) NOT NULL, ADD outcome NUMERIC(10, 2) NOT NULL, ADD devise VARCHAR(5) NOT NULL, DROP cfa, DROP aed, DROP eur, DROP usd, DROP gbp, DROP cny, DROP mad, DROP dzd
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE exchange ADD agence_id INT DEFAULT NULL, ADD to_currency VARCHAR(5) NOT NULL, ADD from_amount NUMERIC(15, 2) NOT NULL, ADD to_amount NUMERIC(15, 2) NOT NULL, DROP montant_devise, DROP montant_cfa, CHANGE devise from_currency VARCHAR(5) NOT NULL
        SQL);
        $this->addSql(<<<'SQL'
            ALTER TABLE exchange ADD CONSTRAINT FK_D33BB079D725330D FOREIGN KEY (agence_id) REFERENCES agence (id)
        SQL);
        $this->addSql(<<<'SQL'
            CREATE INDEX IDX_D33BB079D725330D ON exchange (agence_id)
        SQL);
    }
}

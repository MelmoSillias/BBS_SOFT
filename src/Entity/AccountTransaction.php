<?php

namespace App\Entity;

use App\Repository\AccountTransactionRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Doctrine\ORM\Mapping\JoinColumn;

#[ORM\Entity(repositoryClass: AccountTransactionRepository::class)]
class AccountTransaction
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null; 

    #[ORM\Column(length: 255)]
    private ?string $describ = null; 

     // Montant en CFA
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $CFA = null;

    // Montant en AED
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $AED = null;

    // Montant en EUR
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $EUR = null;

    // Montant en USD
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $USD = null;

    // Montant en GBP
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $GBP = null;

    // Montant en CNY
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $CNY = null;

    // Montant en MAD
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $MAD = null;

    // Montant en DZD
    #[ORM\Column(type: 'decimal', precision: 15, scale: 2, nullable: true)]
    private ?string $DZD = null;

    #[ORM\ManyToOne(inversedBy: 'accountTransactions')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Client $client = null; 

    #[ORM\ManyToOne(inversedBy: 'transactions')]
    private ?Exchange $exchange = null;

    #[ORM\ManyToOne(inversedBy: 'accountTransactions')]
    private ?Agence $agence = null;

    #[ORM\ManyToOne(inversedBy: 'accountTransactions')]
    private ?Transfert $transfert = null;

    #[ORM\Column(length: 10, nullable: true)]
    private ?string $type = null; 
     
    public function getId(): ?int
    {
        return $this->id;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;

        return $this;
    } 
    

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): static
    {
        $this->client = $client;

        return $this;
    }
 

    public function getDescrib(): ?string
    {
        return $this->describ;
    }

    public function setDescrib(string $describ): static
    {
        $this->describ = $describ;

        return $this;
    } 
    
     // Getters et Setters
    public function getCFA(): ?string
    {
        return $this->CFA;
    }

    public function setCFA(?string $CFA): static
    {
        $this->CFA = $CFA;
        return $this;
    }

    public function getAED(): ?string
    {
        return $this->AED;
    }

    public function setAED(?string $AED): static
    {
        $this->AED = $AED;
        return $this;
    }

    public function getEUR(): ?string
    {
        return $this->EUR;
    }

    public function setEUR(?string $EUR): static
    {
        $this->EUR = $EUR;
        return $this;
    }

    public function getUSD(): ?string
    {
        return $this->USD;
    }

    public function setUSD(?string $USD): static
    {
        $this->USD = $USD;
        return $this;
    }

    public function getGBP(): ?string
    {
        return $this->GBP;
    }

    public function setGBP(?string $GBP): static
    {
        $this->GBP = $GBP;
        return $this;
    }

    public function getCNY(): ?string
    {
        return $this->CNY;
    }

    public function setCNY(?string $CNY): static
    {
        $this->CNY = $CNY;
        return $this;
    }

    public function getMAD(): ?string
    {
        return $this->MAD;
    }

    public function setMAD(?string $MAD): static
    {
        $this->MAD = $MAD;
        return $this;
    }

    public function getDZD(): ?string
    {
        return $this->DZD;
    }

    public function setDZD(?string $DZD): static
    {
        $this->DZD = $DZD;
        return $this;
    }

    public function getExchange(): ?Exchange
    {
        return $this->exchange;
    }

    public function setExchange(?Exchange $exchange): static
    {
        $this->exchange = $exchange;

        return $this;
    }

    public function getAgence(): ?Agence
    {
        return $this->agence;
    }

    public function setAgence(?Agence $agence): static
    {
        $this->agence = $agence;

        return $this;
    }

    public function getTransfert(): ?Transfert
    {
        return $this->transfert;
    }

    public function setTransfert(?Transfert $transfert): static
    {
        $this->transfert = $transfert;

        return $this;
    }

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(?string $type): static
    {
        $this->type = $type;

        return $this;
    }

    public function setAmount(string $currency, string $amount): static
    {
        switch (strtoupper($currency)) {
            case 'CFA':
                $this->setCFA($amount);
                break;
            case 'AED':
                $this->setAED($amount);
                break;
            case 'EUR':
                $this->setEUR($amount);
                break;
            case 'USD':
                $this->setUSD($amount);
                break;
            case 'GBP':
                $this->setGBP($amount);
                break;
            case 'CNY':
                $this->setCNY($amount);
                break;
            case 'MAD':
                $this->setMAD($amount);
                break;
            case 'DZD':
                $this->setDZD($amount);
                break;
            default:
                throw new \InvalidArgumentException(sprintf('La devise "%s" n\'est pas supportée.', $currency));
        }

        return $this;
    }

    public function clearAllCurrencies(): static
    {
        $this->setCFA(null);
        $this->setAED(null);
        $this->setEUR(null);
        $this->setUSD(null);
        $this->setGBP(null);
        $this->setCNY(null);
        $this->setMAD(null);
        $this->setDZD(null);

        return $this;
    }

    public function setExclusiveAmount(string $currency, string $amount): static
    {
        $this->clearAllCurrencies();

        return $this->setAmount($currency, $amount);
    }

    public function getCurrencyName(): ?string
    {
        // Check each currency in a logical order (you can adjust the priority)
        if ($this->getAED() !== null) {
            return 'AED';
        }
        if ($this->getEUR() !== null) {
            return 'EUR';
        }
        if ($this->getUSD() !== null) {
            return 'USD';
        }
        if ($this->getGBP() !== null) {
            return 'GBP';
        }
        if ($this->getCNY() !== null) {
            return 'CNY';
        }
        if ($this->getMAD() !== null) {
            return 'MAD';
        }
        if ($this->getDZD() !== null) {
            return 'DZD';
        }
        
        return null; // No currency has a value
    }

    public function getAmount(?string $currency = null): ?float
    {
        if ($currency === null) {
            $currency = $this->getCurrencyName();
            if ($currency === null) {
                return null; // No currency available
            }
        }
        
        switch ($currency) {
            case 'AED':
                return $this->getAED();
            case 'EUR':
                return $this->getEUR();
            case 'USD':
                return $this->getUSD();
            case 'GBP':
                return $this->getGBP();
            case 'CNY':
                return $this->getCNY();
            case 'MAD':
                return $this->getMAD();
            case 'DZD':
                return $this->getDZD();
            default:
                throw new \InvalidArgumentException(sprintf('La devise "%s" n\'est pas supportée.', $currency));
        }
    }

    #[ORM\ManyToOne(targetEntity: AccountTransaction::class)]
    private ?AccountTransaction $linkedTransaction = null;

    public function getLinkedTransaction(): ?AccountTransaction
    {
        return $this->linkedTransaction;
    }

    public function setLinkedTransaction(?AccountTransaction $transaction): self
    {
        $this->linkedTransaction = $transaction;
        return $this;
    }

    public function isInterClientTransfer(): bool
    {
        $linked = $this->getLinkedTransaction();

        return $linked !== null
            && $this->getClient() !== null
            && $linked->getClient() !== null;
    }

    public function getActiveCurrency(): ?string
    {
        if ($this->getCFA() !== null) {
            return 'CFA';
        }
        if ($this->getAED() !== null) {
            return 'AED';
        }
        if ($this->getEUR() !== null) {
            return 'EUR';
        }
        if ($this->getUSD() !== null) {
            return 'USD';
        }
        if ($this->getGBP() !== null) {
            return 'GBP';
        }
        if ($this->getCNY() !== null) {
            return 'CNY';
        }
        if ($this->getMAD() !== null) {
            return 'MAD';
        }
        if ($this->getDZD() !== null) {
            return 'DZD';
        }

        return null;
    }

    public function getActiveAmount(): ?float
    {
        $currency = $this->getActiveCurrency();
        if ($currency === null) {
            return null;
        }

        return match ($currency) {
            'CFA' => $this->getCFA() !== null ? (float) $this->getCFA() : null,
            'AED' => $this->getAED() !== null ? (float) $this->getAED() : null,
            'EUR' => $this->getEUR() !== null ? (float) $this->getEUR() : null,
            'USD' => $this->getUSD() !== null ? (float) $this->getUSD() : null,
            'GBP' => $this->getGBP() !== null ? (float) $this->getGBP() : null,
            'CNY' => $this->getCNY() !== null ? (float) $this->getCNY() : null,
            'MAD' => $this->getMAD() !== null ? (float) $this->getMAD() : null,
            'DZD' => $this->getDZD() !== null ? (float) $this->getDZD() : null,
            default => null,
        };
    }
}

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

    #[ORM\Column]
    #[JoinColumn(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $income = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $outcome = null;

    #[ORM\Column(length: 30)]
    private ?string $account_type = null; 

    #[ORM\Column(length: 30)]
    private ?string $status = null;

    #[ORM\Column(length: 255)]
    private ?string $paymentMethod = null;

    #[ORM\Column(length: 255)]
    private ?string $paymentRef = null;

    #[ORM\ManyToOne(inversedBy: 'accountTransactions')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Client $client = null; 

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE, nullable: true)]
    private ?\DateTimeImmutable $validate_at = null;
 
    #[ORM\Column(length: 255)]
    private ?string $describ = null;

    #[ORM\Column(length: 255)]
    private ?string $reason = null;

    #[ORM\OneToOne(mappedBy: 'transaction', cascade: ['persist', 'remove'])]
    private ?Transfert $transfert = null;

    #[ORM\Column(length: 5)]
    private ?string $devise = null;

    #[ORM\ManyToOne(inversedBy: 'transactions')]
    private ?Exchange $exchange = null;
    

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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getIncome(): ?string
    {
        return $this->income;
    }

    public function setIncome(string $income): static
    {
        $this->income = $income;

        return $this;
    }

    public function getOutcome(): ?string
    {
        return $this->outcome;
    }

    public function setOutcome(string $outcome): static
    {
        $this->outcome = $outcome;

        return $this;
    }

    public function getAccountType(): ?string
    {
        return $this->account_type;
    }

    public function setAccountType(string $account_type): static
    {
        $this->account_type = $account_type;

        return $this;
    }
 

    public function getStatus(): ?string
    {
        return $this->status;
    }

    public function setStatus(string $status): static
    {
        $this->status = $status;

        return $this;
    }

    public function getPaymentMethod(): ?string
    {
        return $this->paymentMethod;
    }

    public function setPaymentMethod(string $paymentMethod): static
    {
        $this->paymentMethod = $paymentMethod;

        return $this;
    }

    public function getPaymentRef(): ?string
    {
        return $this->paymentRef;
    }

    public function setPaymentRef(string $paymentRef): static
    {
        $this->paymentRef = $paymentRef;

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
 
    public function getValidateAt(): ?\DateTimeImmutable
    {
        return $this->validate_at;
    }

    public function setValidateAt(?\DateTimeImmutable $validate_at): static
    {
        $this->validate_at = $validate_at;

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

    public function getReason(): ?string
    {
        return $this->reason;
    }

    public function setReason(string $reason): static
    {
        $this->reason = $reason;

        return $this;
    }

    public function getTransfert(): ?Transfert
    {
        return $this->transfert;
    }

    public function setTransfert(?Transfert $transfert): static
    {
        // unset the owning side of the relation if necessary
        if ($transfert === null && $this->transfert !== null) {
            $this->transfert->setTransaction(null);
        }

        // set the owning side of the relation if necessary
        if ($transfert !== null && $transfert->getTransaction() !== $this) {
            $transfert->setTransaction($this);
        }

        $this->transfert = $transfert;

        return $this;
    }

    public function getDevise(): ?string
    {
        return $this->devise;
    }

    public function setDevise(string $devise): static
    {
        $this->devise = $devise;

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
}

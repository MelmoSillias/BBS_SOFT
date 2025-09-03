<?php

namespace App\Entity;

use App\Repository\TransfertRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransfertRepository::class)]
class Transfert
{

    public const STATUS_PENDING = 'pending'; 
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 55)]
    private ?string $type = null;
  
    #[ORM\ManyToOne(inversedBy: 'transferts')]
    private ?Client $client = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $montantCFA = null;
 
    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $montantUSD = null; 

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 5)]
    private ?string $taux = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $Frais = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $senderName = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $senderPhone = null;

    #[ORM\Column(length: 255)]
    private ?string $receiverName = null;

    #[ORM\Column(length: 255)]
    private ?string $ReceiverPhone = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 2)]
    private ?string $montantReception = null;
 
    #[ORM\Column(length: 55)]
    private ?string $status = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(length: 10)]
    private ?string $ref = null;  

    /**
     * @var Collection<int, AccountTransaction>
     */
    #[ORM\OneToMany(targetEntity: AccountTransaction::class, mappedBy: 'transfert')]
    private Collection $accountTransactions;

    #[ORM\ManyToOne(inversedBy: 'transferts')]
    #[ORM\JoinColumn(nullable: false)]
    private ?Agence $agence = null;

    public function __construct()
    {
        $this->accountTransactions = new ArrayCollection();
    } 

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

    public function getType(): ?string
    {
        return $this->type;
    }

    public function setType(string $type): static
    {
        $this->type = $type;

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

    public function getMontantCFA(): ?string
    {
        return $this->montantCFA;
    }

    public function setMontantCFA(string $montantCFA): static
    {
        $this->montantCFA = $montantCFA;

        return $this;
    }

    public function getMontantUSD(): ?string
    {
        return $this->montantUSD;
    }

    public function setMontantUSD(string $montantUSD): static
    {
        $this->montantUSD = $montantUSD;

        return $this;
    }

    public function getMontantReception(): ?string
    {
        return $this->montantReception;
    }

    public function setMontantReception(string $MontantReception): static
    {
        $this->montantReception = $MontantReception;

        return $this;
    }

    public function getTaux(): ?string
    {
        return $this->taux;
    }

    public function setTaux(string $taux): static
    {
        $this->taux = $taux;

        return $this;
    }

    public function getFrais(): ?string
    {
        return $this->Frais;
    }

    public function setFrais(string $Frais): static
    {
        $this->Frais = $Frais;

        return $this;
    }

    public function getSenderName(): ?string
    {
        return $this->senderName;
    }

    public function setSenderName(?string $senderName): static
    {
        $this->senderName = $senderName;

        return $this;
    }

    public function getSenderPhone(): ?string
    {
        return $this->senderPhone;
    }

    public function setSenderPhone(?string $senderPhone): static
    {
        $this->senderPhone = $senderPhone;

        return $this;
    }

    public function getReceiverName(): ?string
    {
        return $this->receiverName;
    }

    public function setReceiverName(string $receiverName): static
    {
        $this->receiverName = $receiverName;

        return $this;
    }

    public function getReceiverPhone(): ?string
    {
        return $this->ReceiverPhone;
    }

    public function setReceiverPhone(string $ReceiverPhone): static
    {
        $this->ReceiverPhone = $ReceiverPhone;

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

    public function getUpdatedAt(): ?\DateTimeImmutable
    {
        return $this->updatedAt;
    }

    public function setUpdatedAt(?\DateTimeImmutable $updatedAt): static
    {
        $this->updatedAt = $updatedAt;

        return $this;
    }

    public function getRef(): ?string
    {
        return $this->ref;
    }

    public function setRef(string $ref): static
    {
        $this->ref = $ref;

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

    public function getAccountTransactions(): ?Collection
    {
        return $this->accountTransactions;
    }

    public function setAccountTransactions(?Collection $accountTransactions): static
    {
        $this->accountTransactions = $accountTransactions;
        return $this;
    }

    public function addAccountTransaction(AccountTransaction $accountTransaction): static
    {
        if (!$this->accountTransactions->contains($accountTransaction)) {
            $this->accountTransactions[] = $accountTransaction;
            $accountTransaction->setTransfert($this);
        }
        return $this;
    }
    
    public function removeAccountTransaction(AccountTransaction $accountTransaction): static
    {
        if ($this->accountTransactions->contains($accountTransaction)) {
            $this->accountTransactions->removeElement($accountTransaction);
            if ($accountTransaction->getTransfert() === $this) {
                $accountTransaction->setTransfert(null);
            }
        }
        return $this;
    }
 

}

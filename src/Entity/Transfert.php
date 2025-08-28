<?php

namespace App\Entity;

use App\Repository\TransfertRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransfertRepository::class)]
class Transfert
{

    public const STATUS_PENDING = 'pending';
    public const STATUS_PROCESSING = 'processing';
    public const STATUS_COMPLETED = 'completed';
    public const STATUS_CANCELLED = 'cancelled';

    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column(length: 55)]
    private ?string $Type = null;

    #[ORM\Column(length: 255)]
    private ?string $destination = null;

    #[ORM\ManyToOne(inversedBy: 'transferts')]
    private ?Client $client = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 0)]
    private ?string $montantCash = null;

    #[ORM\Column(length: 8)]
    private ?string $deviseCash = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 0)]
    private ?string $MontantReception = null;

    #[ORM\Column(length: 8)]
    private ?string $deviseReception = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 5)]
    private ?string $Taux = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 0)]
    private ?string $Frais = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $vanishClientName = null;

    #[ORM\Column(length: 255, nullable: true)]
    private ?string $vanishClientPhone = null;

    #[ORM\Column(length: 255)]
    private ?string $receiverName = null;

    #[ORM\Column(length: 255)]
    private ?string $ReceiverPhone = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 3)]
    private ?string $TauxDeviseReception = null;

    #[ORM\Column(length: 55)]
    private ?string $status = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $updatedAt = null;

    #[ORM\Column(length: 10)]
    private ?string $ref = null;

    #[ORM\OneToOne(inversedBy: 'transfert', cascade: ['persist', 'remove'])]
    private ?AccountTransaction $transaction = null;

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
        return $this->Type;
    }

    public function setType(string $Type): static
    {
        $this->Type = $Type;

        return $this;
    }

    public function getDestination(): ?string
    {
        return $this->destination;
    }

    public function setDestination(string $destination): static
    {
        $this->destination = $destination;

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

    public function getMontantCash(): ?string
    {
        return $this->montantCash;
    }

    public function setMontantCash(string $montantCash): static
    {
        $this->montantCash = $montantCash;

        return $this;
    }

    public function getDeviseCash(): ?string
    {
        return $this->deviseCash;
    }

    public function setDeviseCash(string $deviseCash): static
    {
        $this->deviseCash = $deviseCash;

        return $this;
    }

    public function getMontantReception(): ?string
    {
        return $this->MontantReception;
    }

    public function setMontantReception(string $MontantReception): static
    {
        $this->MontantReception = $MontantReception;

        return $this;
    }

    public function getDeviseReception(): ?string
    {
        return $this->deviseReception;
    }

    public function setDeviseReception(string $deviseReception): static
    {
        $this->deviseReception = $deviseReception;

        return $this;
    }

    public function getTaux(): ?string
    {
        return $this->Taux;
    }

    public function setTaux(string $Taux): static
    {
        $this->Taux = $Taux;

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

    public function getVanishClientName(): ?string
    {
        return $this->vanishClientName;
    }

    public function setVanishClientName(?string $vanishClientName): static
    {
        $this->vanishClientName = $vanishClientName;

        return $this;
    }

    public function getVanishClientPhone(): ?string
    {
        return $this->vanishClientPhone;
    }

    public function setVanishClientPhone(?string $vanishClientPhone): static
    {
        $this->vanishClientPhone = $vanishClientPhone;

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

    public function getTauxDeviseReception(): ?string
    {
        return $this->TauxDeviseReception;
    }

    public function setTauxDeviseReception(string $TauxDeviseReception): static
    {
        $this->TauxDeviseReception = $TauxDeviseReception;

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

    public function getTransaction(): ?AccountTransaction
    {
        return $this->transaction;
    }

    public function setTransaction(?AccountTransaction $transaction): static
    {
        $this->transaction = $transaction;

        return $this;
    }
}

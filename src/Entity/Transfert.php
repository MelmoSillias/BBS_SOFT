<?php

namespace App\Entity;

use App\Repository\TransfertRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: TransfertRepository::class)]
class Transfert
{
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

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 0)]
    private ?string $Taux = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 0)]
    private ?string $Frais = null;

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
}

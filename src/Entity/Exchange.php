<?php

namespace App\Entity;

use App\Repository\ExchangeRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: ExchangeRepository::class)]
class Exchange
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['agence:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 5)]
    #[Groups(['agence:read'])]
    private ?string $FromCurrency = null;

    #[ORM\Column(length: 5)]
    #[Groups(['agence:read'])]
    private ?string $ToCurrency = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 2)]
    #[Groups(['agence:read'])]
    private ?string $FromAmount = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 15, scale: 2)]
    #[Groups(['agence:read'])]
    private ?string $ToAmount = null;

    #[ORM\Column(type: Types::DECIMAL, precision: 10, scale: 5)]
    #[Groups(['agence:read'])]
    private ?string $taux = null;

    #[ORM\ManyToOne(inversedBy: 'exchanges')]
    #[ORM\JoinColumn(nullable: true)] 
    private ?Client $client = null;

    /**
     * @var Collection<int, AccountTransaction>
     */
    #[ORM\OneToMany(targetEntity: AccountTransaction::class, mappedBy: 'exchange', cascade: ['persist', 'remove'])]
    private Collection $transactions;

    #[ORM\ManyToOne(inversedBy: 'exchanges')]
    #[ORM\JoinColumn(nullable: true)]
    private ?Agence $agence = null;

    #[ORM\Column(length: 255)]
    #[Groups(['agence:read'])]
    private ?string $Description = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['agence:read'])]
    private ?string $vanishClientName = null;

    #[ORM\Column(length: 255, nullable: true)]
    #[Groups(['agence:read'])]
    private ?string $VanishClientTel = null;

    #[ORM\Column(nullable: true)]
    private ?\DateTimeImmutable $date = null;

    #[ORM\Column(length: 10)]
    private ?string $type = null;

    public function __construct()
    {
        $this->transactions = new ArrayCollection();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getFromCurrency(): ?string
    {
        return $this->FromCurrency;
    }

    public function setFromCurrency(string $FromCurrency): static
    {
        $this->FromCurrency = $FromCurrency;

        return $this;
    }

    public function getToCurrency(): ?string
    {
        return $this->ToCurrency;
    }

    public function setToCurrency(string $ToCurrency): static
    {
        $this->ToCurrency = $ToCurrency;

        return $this;
    }

    public function getFromAmount(): ?string
    {
        return $this->FromAmount;
    }

    public function setFromAmount(string $FromAmount): static
    {
        $this->FromAmount = $FromAmount;

        return $this;
    }

    public function getToAmount(): ?string
    {
        return $this->ToAmount;
    }

    public function setToAmount(string $ToAmount): static
    {
        $this->ToAmount = $ToAmount;

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

    public function getClient(): ?Client
    {
        return $this->client;
    }

    public function setClient(?Client $client): static
    {
        $this->client = $client;

        return $this;
    }

    /**
     * @return Collection<int, AccountTransaction>
     */
    public function getTransactions(): Collection
    {
        return $this->transactions;
    }

    public function addTransaction(AccountTransaction $transaction): static
    {
        if (!$this->transactions->contains($transaction)) {
            $this->transactions->add($transaction);
            $transaction->setExchange($this);
        }

        return $this;
    }

    public function removeTransaction(AccountTransaction $transaction): static
    {
        if ($this->transactions->removeElement($transaction)) {
            // set the owning side to null (unless already changed)
            if ($transaction->getExchange() === $this) {
                $transaction->setExchange(null);
            }
        }

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

    public function getDescription(): ?string
    {
        return $this->Description;
    }

    public function setDescription(string $Description): static
    {
        $this->Description = $Description;

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

    public function getVanishClientTel(): ?string
    {
        return $this->VanishClientTel;
    }

    public function setVanishClientTel(?string $VanishClientTel): static
    {
        $this->VanishClientTel = $VanishClientTel;

        return $this;
    }

    public function getDate(): ?\DateTimeImmutable
    {
        return $this->date;
    }

    public function setDate(?\DateTimeImmutable $date): static
    {
        $this->date = $date;

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
}

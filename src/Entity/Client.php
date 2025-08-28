<?php

namespace App\Entity;

use App\Repository\ClientRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: ClientRepository::class)]
class Client
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    private ?string $nom_complet = null;
 
    #[ORM\Column(length: 255)]
    private ?string $address = null;

    #[ORM\Column(length: 255)]
    private ?string $phone_number = null;
  
    /**
     * @var Collection<int, AccountTransaction>
     */
    #[ORM\OneToMany(targetEntity: AccountTransaction::class, mappedBy: 'client')]
    private Collection $accountTransactions;
 
    #[ORM\Column]
    private ?bool $is_active = null;

    /**
     * @var Collection<int, Transfert>
     */
    #[ORM\OneToMany(targetEntity: Transfert::class, mappedBy: 'client')]
    private Collection $transferts;

    /**
     * @var Collection<int, Exchange>
     */
    #[ORM\OneToMany(targetEntity: Exchange::class, mappedBy: 'client', orphanRemoval: true)]
    private Collection $exchanges;
 
    public function __construct()
    { 
        $this->accountTransactions = new ArrayCollection();
        $this->transferts = new ArrayCollection();
        $this->exchanges = new ArrayCollection();  
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getNomComplet(): ?string
    {
        return $this->nom_complet;
    }

    public function setNomComplet(string $nom_complet): static
    {
        $this->nom_complet = $nom_complet;

        return $this;
    }
 
    public function getAddress(): ?string
    {
        return $this->address;
    }

    public function setAddress(string $address): static
    {
        $this->address = $address;

        return $this;
    }

    public function getPhoneNumber(): ?string
    {
        return $this->phone_number;
    }

    public function setPhoneNumber(string $phone_number): static
    {
        $this->phone_number = $phone_number;

        return $this;
    }
 
    /**
     * @return Collection<int, AccountTransaction>
     */
    public function getAccountTransactions(): Collection
    {
        return $this->accountTransactions;
    }

    public function addAccountTransaction(AccountTransaction $accountTransaction): static
    {
        if (!$this->accountTransactions->contains($accountTransaction)) {
            $this->accountTransactions->add($accountTransaction);
            $accountTransaction->setClient($this);
        }

        return $this;
    }

    public function removeAccountTransaction(AccountTransaction $accountTransaction): static
    {
        if ($this->accountTransactions->removeElement($accountTransaction)) {
            // set the owning side to null (unless already changed)
            if ($accountTransaction->getClient() === $this) {
                $accountTransaction->setClient(null);
            }
        }

        return $this;
    }
  
    public function isActive(): ?bool
    {
        return $this->is_active;
    }

    public function setIsActive(bool $is_active): static
    {
        $this->is_active = $is_active;

        return $this;
    }
  
    public function getBalance(string $currency): float
    {
        $balance = 0.0;
        
        foreach ($this->accountTransactions as $transaction) {
            // Vérifier si la transaction est dans la devise demandée
            // (Supposons que AccountTransaction a une propriété 'currency')
            if ($transaction->getDevise() === $currency) {
                // Ajouter les entrées et soustraire les sorties
                $balance += (float)$transaction->getIncome();
                $balance -= (float)$transaction->getOutcome();
            }
        }
        
        return $balance;
    }

    /**
     * @return Collection<int, Transfert>
     */
    public function getTransferts(): Collection
    {
        return $this->transferts;
    }

    public function addTransfert(Transfert $transfert): static
    {
        if (!$this->transferts->contains($transfert)) {
            $this->transferts->add($transfert);
            $transfert->setClient($this);
        }

        return $this;
    }

    public function removeTransfert(Transfert $transfert): static
    {
        if ($this->transferts->removeElement($transfert)) {
            // set the owning side to null (unless already changed)
            if ($transfert->getClient() === $this) {
                $transfert->setClient(null);
            }
        }

        return $this;
    }

    /**
     * @return Collection<int, Exchange>
     */
    public function getExchanges(): Collection
    {
        return $this->exchanges;
    }

    public function addExchange(Exchange $exchange): static
    {
        if (!$this->exchanges->contains($exchange)) {
            $this->exchanges->add($exchange);
            $exchange->setClient($this);
        }

        return $this;
    }

    public function removeExchange(Exchange $exchange): static
    {
        if ($this->exchanges->removeElement($exchange)) {
            // set the owning side to null (unless already changed)
            if ($exchange->getClient() === $this) {
                $exchange->setClient(null);
            }
        }

        return $this;
    }
}

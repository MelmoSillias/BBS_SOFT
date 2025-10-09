<?php

namespace App\Entity;

use App\Repository\AgenceRepository;
use Doctrine\Common\Collections\ArrayCollection;
use Doctrine\Common\Collections\Collection;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Serializer\Annotation\Groups;

#[ORM\Entity(repositoryClass: AgenceRepository::class)]
class Agence
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    #[Groups(['agence:read'])]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Groups(['agence:read'])]
    private ?string $Designation = null;
 
    #[ORM\Column(length: 255)]
    #[Groups(['agence:read'])]
    private ?string $localite = null;

    #[ORM\Column]
    #[Groups(['agence:read'])]
    private ?\DateTimeImmutable $createdAt = null;

    #[ORM\Column]
    #[Groups(['agence:read'])]
    private ?bool $isActive = null;
 
    #[ORM\Column(length: 5)]
    private ?string $abg = null;

    /**
     * @var Collection<int, AccountTransaction>
     */
    #[ORM\OneToMany(targetEntity: AccountTransaction::class, mappedBy: 'agence')]
    private Collection $accountTransactions;

    #[ORM\Column(length: 5)]
    private ?string $devise_local = null; 
    
    public function __construct()
    { 
        $this->accountTransactions = new ArrayCollection();  
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getDesignation(): ?string
    {
        return $this->Designation;
    }

    public function setDesignation(string $Designation): static
    {
        $this->Designation = $Designation;

        return $this;
    }   
    
    public function getLocalite(): ?string
    {
        return $this->localite;
    }

    public function setLocalite(string $localite): static
    {
        $this->localite = $localite;

        return $this;
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

    public function isActive(): ?bool
    {
        return $this->isActive;
    }

    public function setIsActive(bool $isActive): static
    {
        $this->isActive = $isActive;

        return $this;
    }
 

    public function getAbg(): ?string
    {
        return $this->abg;
    }

    public function setAbg(string $abg): static
    {
        $this->abg = $abg;

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
            $accountTransaction->setAgence($this);
        }

        return $this;
    }

    public function removeAccountTransaction(AccountTransaction $accountTransaction): static
    {
        if ($this->accountTransactions->removeElement($accountTransaction)) {
            // set the owning side to null (unless already changed)
            if ($accountTransaction->getAgence() === $this) {
                $accountTransaction->setAgence(null);
            }
        }

        return $this;
    }

    public function getDeviseLocal(): ?string
    {
        return $this->devise_local;
    }

    public function setDeviseLocal(string $devise_local): static
    {
        $this->devise_local = $devise_local;

        return $this;
    } 

}

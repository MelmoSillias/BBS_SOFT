<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Client;
use App\Entity\Invoice;
use App\Entity\InvoiceItem;
use App\Entity\RenewableInvoice;
use App\Entity\RenewableInvoiceItem;
use App\Repository\ClientRepository;
use DateTimeImmutable;
use Doctrine\Migrations\Tools\TransactionHelper;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ClientController extends AbstractController
{ 

    #[Route('/dashboard/client', name: 'app_client')]
    public function index(): Response
    {
        return $this->render('client/index.html.twig', [
            'controller_name' => 'ClientController',
        ]);
    }

    #[Route('/dashboard/client/{id}/modify', name: 'client_modify_submit', methods: ['POST'])]
    public function modifySubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupération des champs
        $client->setNomComplet($request->request->get('companyName')) 
               ->setPhoneNumber($request->request->get('phoneNumber'))
               ->setAddress($request->request->get('address')); 

        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/dashboard/client/{id}/details', name: 'client_details_modal', methods: ['GET'])]
    public function ShowClient(Client $client): Response
    {
        // On peut récupérer ici factures ou transactions si besoin
        return $this->render('client/client_show.html.twig', [
            'controller_name' => 'ClientController',
            'client' => $client,
        ]);
    }

    #[Route('/api/client/{id}/smalldetails', name: 'client_small_details', methods: ['GET'])]
    public function smallDetails(Client $client ,Request $request, EntityManagerInterface $em): JsonResponse
    {
        if (!$client) {
            return $this->json(['error' => 'Client not found'], 404);
        }

        return $this->json([
            'id' => $client->getId(),
            'nomComplet' => $client->getNomComplet(),
            'phoneNumber' => $client->getPhoneNumber(), 
            'address' => $client->getAddress(), 
        ]);
    }

    #[Route('/dashboard/client/{id}/accompte', name: 'client_accompte_submit', methods: ['POST'])]
    public function accompteSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $amount = (float) $request->request->get('amount', 0);
        $ref_payment = $request->request->get('reference', ''); // Référence de paiement
        $method_payment = $request->request->get('mode', ''); // Méthode de paiement
        $note = $request->request->get('note', ''); // Note de la transaction
        // Récupérer le dernier solde (balance_at) de ce client
        $lastTransaction = $em->getRepository(AccountTransaction::class)
            ->findOneBy(['client' => $client], ['id' => 'DESC']);

        $last_balance_at = $lastTransaction ? $lastTransaction->getBalanceValue() : 0;

        $new_balance_at = $last_balance_at + $amount;

        if ($amount <= 0) {
            return $this->json(['error' => 'Invalid amount'], 400);
        }

        // 1. Créer un enregistrement de transaction (acompte client)
        $tx = new AccountTransaction();
        $tx->setClient($client)
           ->setIncome($amount)
           ->setBalanceValue($new_balance_at)
           ->setOutcome(0)
           ->setAccountType('client')
           ->setUpdatedAt(new \DateTimeImmutable())
           ->setReason('Versement compte client')
           ->setPaymentRef($ref_payment)
           ->setDescrib($note)
           ->setStatus('validé')
           ->setCreatedAt(new \DateTimeImmutable())
           ->setPaymentMethod($method_payment)// à adapter si besoin
           ->setUser($this->getUser());
        $em->persist($tx);

        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/api/clients', name: 'api_clients_list', methods: ['GET'])]
    public function clientsList(EntityManagerInterface $em): JsonResponse
    {
        $clients = $em->getRepository(Client::class)->findAll();
        $data = [];

        foreach ($clients as $client) {
    
            // Récupérer le solde (balance_value) de la dernière transaction du client
            $lastTransaction = $em->getRepository(AccountTransaction::class)
                ->findOneBy(['client' => $client], ['id' => 'DESC']);
            $balance = $lastTransaction ? $lastTransaction->getBalanceValue() : 0;
            

            $data[] = [
                'id'           => $client->getId(), 
                'nomComplet'  => $client->getNomComplet(),
                'phoneNumber'  => $client->getPhoneNumber(),
                'balance'      => $balance,
            ];
        }

        return $this->json(['data' => $data]);
    }

    #[Route('/api/clients/stats', name: 'api_clients_stats', methods: ['GET'])]
    public function clientsStats(EntityManagerInterface $em): JsonResponse
    {
        $repo = $em->getRepository(Client::class);
        $total  = count($repo->findAll()); 

        return $this->json([
            'total'  => $total, 
        ]);
    }

    #[Route('/api/client/add', name: 'api_client_add', methods: ['POST'])]
    public function clientAdd(Request $request, EntityManagerInterface $em): JsonResponse
    {
        $client = new Client();
        $client->setNomComplet($request->request->get('nomComplet')) 
               ->setPhoneNumber($request->request->get('phoneNumber'))
               ->setAddress($request->request->get('address'))  
               ->setISActive(true); 
        $em->persist($client);
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/api/client/{id}/deactivate', name: 'api_client_deactivate', methods: ['POST'])]
    public function clientDeactivate(Client $client, EntityManagerInterface $em): JsonResponse
    {
        // Désactivation soft
        $client->setIsActive(false);
        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/api/client/{id}/stats', name: 'client_stats', methods: ['GET'])]
    public function stats(Client $client, EntityManagerInterface $em): JsonResponse
    { 
        $lastTransaction = $em->getRepository(AccountTransaction::class)
                ->findOneBy(['client' => $client], ['id' => 'DESC']);
            $balance = $lastTransaction ? $lastTransaction->getBalanceValue() : 0;
  

        return $this->json([
            'balance'          => $balance,   
        ]);
    } 
   
    /**
     * Liste des transactions du client (+ filtre type)
     */
    #[Route('/api/client/{id}/transactions', name: 'client_transactions', methods: ['GET'])]
    public function listTransactions(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $type = $request->query->get('type');
        $repo = $em->getRepository(AccountTransaction::class);

        $qb = $repo->createQueryBuilder('t')
            ->where('t.client = :client')
            ->setParameter('client', $client);

        if ($type === 'Entrée') {
            $qb->andWhere('t.income > 0');
        } elseif ($type === 'Sortie') {
            $qb->andWhere('t.outcome > 0');
        }

        $qb->orderBy('t.createdAt', 'DESC');
        $transactions = $qb->getQuery()->getResult();

        $list = [];
        foreach ($transactions as $tx) {
            // Déterminer le type dynamiquement
            $txType = $tx->getIncome() > 0 ? 'entrée' : ($tx->getOutcome() > 0 ? 'sortie' : 'autre');
            $list[] = [
                'date'             => $tx->getCreatedAt()->format('Y-m-d'),
                'type'             => $txType,
                'amount'           => $tx->getIncome() - $tx->getOutcome(),
                'paymentMethod'    => $tx->getPaymentMethod(),
                'paymentReference' => $tx->getPaymentRef(),
            ];
        }
        return $this->json(['data' => $list]);
    }

}

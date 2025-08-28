<?php

namespace App\Controller;

use App\Entity\AccountTransaction;
use App\Entity\Client;
use App\Entity\Exchange;
use App\Entity\Invoice;
use App\Entity\InvoiceItem;
use App\Entity\RenewableInvoice;
use App\Entity\RenewableInvoiceItem;
use App\Entity\Transfert;
use App\Repository\ClientRepository;
use DateTimeImmutable;
use Doctrine\Migrations\Tools\TransactionHelper;
use Doctrine\ORM\EntityManagerInterface;
use PhpParser\Node\Expr\Cast\Array_;
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

    #[Route('/client/{id}/modify', name: 'client_modify_submit', methods: ['POST'])]
    public function modifySubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupération des champs
        $client->setNomComplet($request->request->get('nomComplet')) 
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
          $cur = $request->request->get('currency', ''); 

        if ($amount <= 0) {
            return $this->json(['error' => 'Invalid amount'], 400);
        }

        // 1. Créer un enregistrement de transaction (acompte client)
        $tx = new AccountTransaction();
        $tx->setClient($client)
           ->setIncome($amount) 
           ->setDevise($cur)
           ->setOutcome(0)
           ->setAccountType('client')
           ->setUpdatedAt(new \DateTimeImmutable())
           ->setReason('Versement compte client')
           ->setPaymentRef($ref_payment)
           ->setDescrib("Retrait de $cur compte client")
           ->setStatus('validé')
           ->setCreatedAt(new \DateTimeImmutable())
           ->setPaymentMethod($method_payment);
        $em->persist($tx);

        $em->flush();
        return $this->json(['success' => true]);
    }

    #[Route('/dashboard/client/{id}/retrait', name: 'client_retrait_submit', methods: ['POST'])]
    public function retraitSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $amount = (float) $request->request->get('amount', 0);
        $ref_payment = $request->request->get('reference', ''); // Référence de paiement
        $method_payment = $request->request->get('mode', ''); // Méthode de paiement
        $note = $request->request->get('note', ''); // Note de la transaction
        $cur = $request->request->get('currency', '');
        
        $balance = $client->getbalance($cur);

        if ($amount <= 0 or $amount > $balance) {
            return $this->json(['error' => 'Montant invalide'], 400);
        }

        // 1. Créer un enregistrement de transaction (acompte client)
        $tx = new AccountTransaction();
        $tx->setClient($client)
           ->setIncome(0) 
           ->setDevise($cur)
           ->setOutcome($amount)
           ->setAccountType('client')
           ->setUpdatedAt(new \DateTimeImmutable())
           ->setReason("Retrait de $cur compte client")
           ->setPaymentRef($ref_payment)
           ->setDescrib("Retrait de $cur compte client")
           ->setStatus('validé')
           ->setCreatedAt(new \DateTimeImmutable())
           ->setPaymentMethod($method_payment);
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
            $data[] = [
                'id'           => $client->getId(), 
                'nomComplet'  => $client->getNomComplet(),
                'phoneNumber'  => $client->getPhoneNumber(),
                'balanceCFA'      => $client->getbalance("CFA"),
                'balanceUSD'      => $client->getbalance("USD"),
                'balanceEUR'      => $client->getbalance("EUR"),
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

    #[Route('/api/client/{id}/stats/{devise}', name: 'client_devise_balance', methods: ['GET'])]
    public function stats(Client $client, EntityManagerInterface $em, Request $req): JsonResponse
    { 
           
        $cur = $req->get('devise');
        return $this->json([
            'balance'          => $client->getbalance($cur)
        ]);
    } 

    #[Route('/api/client/{id}/stats', name: 'client_stats', methods: ['GET'])]
    public function AllStats(Client $client, EntityManagerInterface $em, Request $req): JsonResponse
    { 
        $repo = $em->getRepository(AccountTransaction::class);
        $devises = $repo->createQueryBuilder('t')
                    ->select('DISTINCT t.devise')
                    ->getQuery()
                    ->getResult();
        
        $data = [];
        foreach ($devises as $dev) {
            $cur = $dev['devise'];
            $data[$cur] = $client->getbalance($cur);
        }
        
        return $this->json($data);
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
                'date'             => $tx->getCreatedAt()->format('Y-m-d H:i:s'),
                'type'             => $txType,
                'devise'           => $tx->getDevise(),
                'amount'           => $tx->getIncome() - $tx->getOutcome(),
                'description' => $tx->getDescrib(),
                'paymentMethod'    => $tx->getPaymentMethod(),
                'paymentReference' => $tx->getPaymentRef(),
            ];
        }
        return $this->json(['data' => $list]);
    }

    #[Route('/api/client/{client}/transferts', name: 'api_client_transfert_list', methods: ['GET'])]
    public function listTransferts(EntityManagerInterface $em, Client $client, Request $req): JsonResponse
    {
        // Récupérer les paramètres de la requête
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');
        $status = $req->query->get('status'); 
        $operationType = $req->query->get('type'); 

        // Créer une requête de base
        $queryBuilder = $em->getRepository(Transfert::class)->createQueryBuilder('t');

        $queryBuilder->andWhere('t.client = :client')
                ->setParameter('client', $client);

        // Appliquer les filtres
        if ($startDate && $endDate) {
            $queryBuilder->andWhere('t.createdAt BETWEEN :start AND :end')
                ->setParameter('start', new \DateTime($startDate))
                ->setParameter('end', new \DateTime($endDate));
        }

        if ($status) {
            $queryBuilder->andWhere('t.status = :status')
                ->setParameter('status', $status);
        }

        if ($operationType) {
            $queryBuilder->andWhere('t.Type = :operationType')
                ->setParameter('operationType', $operationType);
        } 

        // Récupérer les résultats sans le filtre de nom pour pouvoir filtrer sur le nom complet
        $transferts = $queryBuilder->getQuery()->getResult();
 

        // Préparer les données de sortie
        $output = array_map(function ($transfert) {
            $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
            return [
                'id' => $transfert->getId(),
                'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
                'type' => $transfert->getType(),
                'destination' => $transfert->getDestination(),
                'typeClient' => !$transfert->getClient() ? 'Client éphémère' : 'Client enregistré',
                'expediteur' => $nomComplet,
                'montantCash' => $transfert->getMontantCash(),
                'deviseCash' => $transfert->getDeviseCash(),
                'montantReception' => $transfert->getMontantReception(),
                'deviseReception' => $transfert->getDeviseReception(),
                'taux' => $transfert->getTaux(),
                'frais' => $transfert->getFrais(),
                'receiverName' => $transfert->getReceiverName(),
                'receiverPhone' => $transfert->getReceiverPhone(),
                'tauxDeviseReception' => $transfert->getTauxDeviseReception(),
                'status' => $transfert->getStatus(),
                'ref' => $transfert->getRef()
            ];
        }, $transferts);

        return new JsonResponse($output);
    }

     #[Route('/api/client/{client}/transferts/stats', name: 'api_client_transfert_stats', methods: ['GET'])]
    public function statsTransferts(EntityManagerInterface $em, Client $client, Request $req): JsonResponse
    {
        // Récupération des dates (optionnelles)
        $startDate = $req->query->get('dateFrom');
        $endDate = $req->query->get('dateTo');

        $qb = $em->getRepository(Transfert::class)->createQueryBuilder('t')->andWhere('t.client = :client')->setParameter('client', $client);

        // Filtre par période
        if ($startDate && $endDate) {
            $qb->andWhere('t.createdAt BETWEEN :start AND :end') 
            ->setParameter('start', new \DateTime($startDate))
            ->setParameter('end', new \DateTime($endDate)) ;
        }

        $transferts = $qb->getQuery()->getResult();

        // Initialisation des stats
        $totalTransferts = count($transferts);
        $totalMontantCash = 0;
        $totalMontantReception = 0;
        $totalFrais = 0;

        $parStatut = [
            'en_attente' => 0,
            'valide' => 0,
            'annule' => 0,
        ];
 

        $parTypeOperation = [];

        foreach ($transferts as $transfert) {
            $totalMontantCash += $transfert->getMontantCash();
            $totalMontantReception += $transfert->getMontantReception();
            $totalFrais += $transfert->getFrais();

            // Par statut
            $statut = $transfert->getStatus();
            if ($statut === 'pending' || $statut === 0) $parStatut['en_attente']++;
            elseif ($statut === 'completed' || $statut === 1) $parStatut['valide']++;
            elseif ($statut === 'cancelled' || $statut === 2) $parStatut['annule']++;
 
            // Par type d’opération
            $typeOp = $transfert->getType();
            if (!isset($parTypeOperation[$typeOp])) {
                $parTypeOperation[$typeOp] = 1;
            } else {
                $parTypeOperation[$typeOp]++;
            }
        }

        $stats = [
            'periode' => $startDate && $endDate ? [
                'du' => $startDate,
                'au' => $endDate,
            ] : 'Toutes périodes',
            'nombre_total' => $totalTransferts,
            'montant_total_cash' => $totalMontantCash,
            'montant_total_reception' => $totalMontantReception,
            'frais_totaux' => $totalFrais,
            'par_statut' => $parStatut, 
            'par_type_operation' => $parTypeOperation,
        ];

        return new JsonResponse($stats);
    }

    #[Route('/api/client/{id}/exchange', name: 'client_exchange_submit', methods: ['POST'])]
    public function exchangeSubmit(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        // Récupérer les données de la requête
        $fromAmount = (float) $request->request->get('fromAmount', 0);
        $toAmount = (float) $request->request->get('toAmount', 0);
        $fromCurrency = $request->request->get('fromCurrency', '');
        $toCurrency = $request->request->get('toCurrency', '');
        $note = $request->request->get('note', ''); // Note de la transaction
        $exchangeRate = (float) $request->request->get('exchangeRate', 0); // Taux de change utilisé
        $ref_payment = $request->request->get('reference', ''); // Référence de paiement

        // Vérifier que les montants et les devises sont valides
        if ($fromAmount <= 0 || $toAmount <= 0 || $fromCurrency === '' || $toCurrency === '' || $fromCurrency === $toCurrency) {
            return $this->json(['error' => 'Invalid exchange details'], 400);
        }

        // Vérifier que le client a un solde suffisant dans la devise de départ
        $balance = $client->getBalance($fromCurrency);
        if ($fromAmount > $balance) {
            return $this->json(['error' => 'Insufficient balance for this exchange'], 400);
        }

        
        // 0 - créer l'échange pour l'opération
        $exchange = new Exchange();
        $exchange->setFromAmount($fromAmount);
        $exchange->setFromCurrency($fromCurrency);
        $exchange->setToCurrency($toCurrency);
        $exchange->setType('client');
        $exchange->setToAmount($toAmount);
        $exchange->setTaux($toAmount / $fromAmount);
        $exchange->setClient($client);
        $exchange->setDescription("Achat de ". $fromCurrency ." Avec ". $toCurrency ."");
        $exchange->setDate(New DateTimeImmutable("now"));
        


        // 1. Créer un enregistrement de transaction pour le retrait de la devise de départ
        $withdrawalTx = new AccountTransaction();
        $withdrawalTx->setClient($client)
            ->setIncome(0)
            ->setOutcome($fromAmount)
            ->setDevise($fromCurrency)
            ->setAccountType('client')
            ->setUpdatedAt(new \DateTimeImmutable())
            ->setReason("Échange de $fromCurrency à $toCurrency")
            ->setDescrib("Vente de $fromCurrency")
            ->setPaymentRef($ref_payment)
            ->setStatus('validé')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setPaymentMethod('Exchange')
            ->setExchange($exchange);

        // 2. Créer un enregistrement de transaction pour le dépôt de la devise d'arrivée
        $depositTx = new AccountTransaction();
        $depositTx->setClient($client)
            ->setIncome($toAmount)
            ->setOutcome(0)
            ->setDevise($toCurrency)
            ->setAccountType('client')
            ->setPaymentRef($ref_payment)
            ->setUpdatedAt(new \DateTimeImmutable())
            ->setReason("Échange de $fromCurrency à $toCurrency")
            ->setDescrib("Achat de $toCurrency")
            ->setStatus('validé')
            ->setCreatedAt(new \DateTimeImmutable())
            ->setPaymentMethod('Exchange')
            ->setExchange($exchange);

        // Persister les transactions dans la base de données
        $em->persist($exchange);
        $em->persist($withdrawalTx);
        $em->persist($depositTx);
        $em->flush();

        return $this->json(['success' => true]);
    }

    #[Route('/api/client/{id}/exchanges', name: 'client_exchange_list', methods: ['GET'])]
    public function clientExchangeList(Client $client, Request $request, EntityManagerInterface $em): JsonResponse
    {
        $exchanges = $em->getRepository(Exchange::class)->findBy(['client'=> $client]); 

        return $this->json(array_map(function($ex){
            return [
                'id' => $ex->getId(),
                'date' => $ex->getDate()->format('Y-m-d H:i:s'),
                'note' => $ex->getDescription(),
                'fromAmount' => $ex->getFromAmount(),
                'fromCurrency' => $ex->getFromCurrency(),
                'toAmount' => $ex->getToAmount(),
                'toCurrency' => $ex->getToCurrency(),
                'taux' => $ex->getTaux(),
            ];
        }, $exchanges));
    }

}

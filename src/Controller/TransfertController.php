<?php

namespace App\Controller;

use App\Entity\Client;
use App\Entity\Transfert;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Mime\Message;
use Symfony\Component\Routing\Attribute\Route;

final class TransfertController extends AbstractController
{
    #[Route('/transfert', name: 'app_transfert')]
    public function index(EntityManagerInterface $em): Response
    {
        $clients = $em->getRepository(Client::class)->findAll();

        return $this->render('transfert/index.html.twig', [
            'controller_name' => 'TransfertController',
            'clients' => $clients
        ]);
    }

    #[Route('/api/transfert/create', name: 'api_transfert_create', methods: ['POST'])]
    public function createTransfert(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les données du corps de la requête
        $data = json_decode($req->getContent(), true);

        // Vérifier si les données sont valides
        if (empty($data)) {
            return new JsonResponse(['error' => 'Invalid request data'], 400);
        }

        // Créer une nouvelle instance de Transfert
        $transfert = new Transfert();

        // Définir les propriétés de l'entité Transfert
        $transfert->setCreatedAt(new \DateTimeImmutable());
        $transfert->setType($data['type']);
        $transfert->setDestination($data['destination']);
        $transfert->setMontantCash($data['montantCash']);
        $transfert->setDeviseCash('CFA'); // Exemple de devise
        $transfert->setMontantReception($data['montantRecu']);
        $transfert->setDeviseReception('USD'); // Exemple de devise
        $transfert->setTaux($data['taux']);
        $transfert->setFrais($data['fraisEnvoi']);
        $transfert->setReceiverName($data['nomBeneficiaire']);
        $transfert->setReceiverPhone($data['phoneBeneficiaire']);
        $transfert->setTauxDeviseReception($data['tauxReception']);

        // Gérer le client éphémère
        if (isset($data['newExpediteurNom']) && isset($data['newExpediteurPhone'])) {
            $transfert->setVanishClientName($data['newExpediteurNom']);
            $transfert->setVanishClientPhone($data['newExpediteurPhone']);
        } else {
            // Si un client existant est sélectionné, vous devez récupérer l'entité Client correspondante
            $clientId = $data['expediteur'];
            $client = $em->getRepository(Client::class)->find($clientId);
            if ($client) {
                $transfert->setClient($client);
            }
        }

        // Persister et sauvegarder l'entité
        $em->persist($transfert);
        $em->flush();

        // Retourner une réponse JSON
        return new JsonResponse(['success' => true, 'transfertId' => $transfert->getId()]);
    }

    #[Route('/api/transferts', name: 'api_transfert_list', methods: ['GET'])]
    public function listTransferts(EntityManagerInterface $em, Request $req): JsonResponse
    {
        // Récupérer les paramètres de la requête
        $startDate = $req->query->get('start_date');
        $endDate = $req->query->get('end_date');
        $status = $req->query->get('status');
        $clientType = $req->query->get('client_type'); // 'vanish' ou 'present'
        $operationType = $req->query->get('operation_type');
        $clientName = $req->query->get('client_name');

        // Créer une requête de base
        $queryBuilder = $em->getRepository(Transfert::class)->createQueryBuilder('t');

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

        if ($clientType === 'vanish') {
            $queryBuilder->andWhere('t.vanishClientName IS NOT NULL');
        } elseif ($clientType === 'present') {
            $queryBuilder->andWhere('t.client IS NOT NULL');
        }

        // Récupérer les résultats sans le filtre de nom pour pouvoir filtrer sur le nom complet
        $transferts = $queryBuilder->getQuery()->getResult();

        // Filtrer les résultats par nom de client
        if ($clientName) {
            $transferts = array_filter($transferts, function ($transfert) use ($clientName) {
                $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
                return stripos($nomComplet, $clientName) !== false;
            });
        }

        // Préparer les données de sortie
        $output = array_map(function ($transfert) {
            $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
            return [
                'id' => $transfert->getId(),
                'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
                'type' => $transfert->getType(),
                'destination' => $transfert->getDestination(),
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
            ];
        }, $transferts);

        return new JsonResponse($output);
    }

     #[Route('/api/transferts/{transfert}', name: 'api_transfert_details', methods: ['GET'])]
    public function DetailsTransfert(Transfert $transfert, EntityManagerInterface $em, Request $req): JsonResponse
    {
        
        if (!$transfert) {
           return $this->json(['error' => 'Transfert invalide'], 404);
        }

        $nomComplet = $transfert->getVanishClientName() ?: ($transfert->getClient() ? $transfert->getClient()->getNomComplet() : '');
        $telephone = $transfert->getVanishClientPhone() ?: ($transfert->getClient() ? $transfert->getClient()->getPhoneNumber() : '');
        // Préparer les données de sortie
        $output =  [
                'id' => $transfert->getId(),
                'createdAt' => $transfert->getCreatedAt()->format('Y-m-d H:i:s'),
                'type' => $transfert->getType(),
                'destination' => $transfert->getDestination(),
                'expediteur' => $nomComplet,
                'phone' => $telephone,
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
            ];

        return new JsonResponse($output);
    }

    #[Route('/api/transferts/{transfert}/validate', name: 'api_transfer_validate', methods: ['POST'])]
    public function validateTransfer(Transfert $transfer, EntityManagerInterface $em): JsonResponse
    {
        // Vérifier que le transfert peut être validé (statut pending par exemple)
        if ($transfer->getStatus() !== Transfert::STATUS_PENDING) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être validé dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        $transfer->setStatus(Transfert::STATUS_COMPLETED);
        $transfer->setUpdatedAt(new \DateTimeImmutable()); 
        
        $em->flush();
        
        return $this->json([
                'success' => false,
                'message' => 'Le transfert a été validé avec succès'
            ], Response::HTTP_OK);
    }
    
    #[Route('/api/transferts/{id}/cancel', name: 'api_transfer_cancel', methods: ['POST'])]
    public function cancelTransfer(
        Transfert $transfer, 
        Request $request
        , EntityManagerInterface $em
    ): JsonResponse {
        // Vérifier que le transfert peut être annulé
        if (!in_array($transfer->getStatus(), [Transfert::STATUS_PENDING, Transfert::STATUS_PROCESSING])) {
            return $this->json([
                'success' => false,
                'message' => 'Le transfert ne peut pas être annulé dans son état actuel'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        $data = json_decode($request->getContent(), true); 
        
        $transfer->setStatus(Transfert::STATUS_CANCELLED);
        $transfer->setUpdatedAt(new \DateTimeImmutable()); 
        
        $em->flush();
        
        return $this->json([
                'success' => false,
                'message' => 'Le transfert a été annulé'
            ], Response::HTTP_OK);
    }
    
    #[Route('/api/transferts/{id}/delete', name: 'api_transfer_delete', methods: ['DELETE'])]
    public function deleteTransfer(Transfert $transfer, EntityManagerInterface $em): JsonResponse
    {
        // Vérifier que le transfert peut être supprimé
        if ($transfer->getStatus() !== Transfert::STATUS_CANCELLED) {
            return $this->json([
                'success' => false,
                'message' => 'Seuls les transferts annulés peuvent être supprimés'
            ], Response::HTTP_BAD_REQUEST);
        }
        
        // Vérifier les permissions (ex: seulement admin ou manager)
        if (!$this->isGranted('ROLE_ADMIN') && !$this->isGranted('ROLE_MANAGER')) {
            return $this->json([
                'success' => false,
                'message' => 'Vous n\'avez pas les permissions nécessaires'
            ], Response::HTTP_FORBIDDEN);
        }
        
        $em->remove($transfer);
        $em->flush();
        
        return $this->json([
            'success' => true,
            'message' => 'Transfert supprimé avec succès'
        ]);
    }

    #[Route('/api/transferts/{id}/receipt', name: 'transfer_receipt')]
    public function generateReceipt(Transfert $transfer): Response
    {
        return $this->render('transfert/print.html.twig', [
            'transfer' => $transfer,
            'company' => [
                'name' => 'BSS',
                'full_name' => 'BUREAU DE SERVICES ET DE SOLUTIONS',
                'address' => '123 Avenue de la République, Dakar, Sénégal',
                'phone' => '+221 33 123 45 67',
                'email' => 'contact@bss.sn',
                'website' => 'www.bss.sn'
            ]
        ]);
    }

}

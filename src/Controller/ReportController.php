<?php

namespace App\Controller;

use App\Repository\AgenceRepository;
use App\Repository\ExchangeRepository;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

final class ReportController extends AbstractController
{
    #[Route('/report', name: 'app_report')]
    public function index(AgenceRepository $repository): Response
    {
        $agences = $repository->findAll();
        $data = [
             [
                'id' => '0',
                'nom' => 'Local',
                'devise' => "CFA",
                'localite' => "BAMAKO",
                'isActive' => True,
                'createdAt' => "Depuis le début",
                // Ajoutez d'autres propriétés nécessaires
             ],
            ];

        $data = array_merge($data, array_map(function($agence) {
            return [
                'id' => $agence->getId(),
                'nom' => $agence->getDesignation(),
                'devise' => $agence->getDevise(),
                'localite' => $agence->getLocalite(),
                'isActive' => $agence->IsActive(),
                'createdAt' => $agence->getCreatedAt()->format('Y-m-d'),
                // Ajoutez d'autres propriétés nécessaires
            ];
        }, $agences));

        dump($data);

        return $this->render('report/index.html.twig', [
            'controller_name' => 'ReportController',
            'agences' => $data,
        ]);
    }

    #[Route('/api/report/agence/{id}', name: 'api_report_agence', methods: ['GET'])]
public function report(
    int $id,
    Request $request,
    ExchangeRepository $exchangeRepository,
    AgenceRepository $agenceRepository
): JsonResponse {
    $startDate = $request->query->get('startDate');
    $endDate = $request->query->get('endDate');

    $start = $startDate ? \DateTimeImmutable::createFromFormat('d/m/Y H:i:s', $startDate . ' 00:00:00') : null;
    $end = $endDate ? \DateTimeImmutable::createFromFormat('d/m/Y H:i:s', $endDate . ' 00:00:00') : null;

    $transactions = [];

    if ($id === 0) {
        // Toutes les agences non nulles en CFA
        $exchanges = $exchangeRepository->createQueryBuilder('e')
            ->where('e.agence IS NOT NULL')
            ->andWhere($start ? 'e.date >= :start' : '1=1')
            ->andWhere($end ? 'e.date <= :end' : '1=1')
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('e.date', 'ASC')
            ->getQuery()
            ->getResult();

        foreach ($exchanges as $exchange) {
            $entree = 0;
            $sortie = 0;

            if ($exchange->getType() === 'achat') {
                $sortie = $exchange->getFromAmount();
            } else {
                $entree = $exchange->getToAmount();
            }

            $transactions[] = [
                'id' => $exchange->getId(),
                'date' => $exchange->getDate()->format('Y-m-d'),
                'description' => "Échange {$exchange->getType()}",
                'entree' => $entree,
                'sortie' => $sortie,
                'devise' => 'CFA'
            ];
        }
    } else {
        // Une agence spécifique
        $agence = $agenceRepository->find($id);
        if (!$agence) {
            return new JsonResponse(['error' => 'Agence introuvable'], Response::HTTP_BAD_REQUEST);
        }

        $exchanges = $exchangeRepository->createQueryBuilder('e')
            ->where('e.agence = :agence')
            ->andWhere($start ? 'e.date >= :start' : '1=1')
            ->andWhere($end ? 'e.date <= :end' : '1=1')
            ->setParameter('agence', $agence)
            ->setParameter('start', $start)
            ->setParameter('end', $end)
            ->orderBy('e.date', 'ASC')
            ->getQuery()
            ->getResult();

        foreach ($exchanges as $exchange) {
            $entree = 0;
            $sortie = 0;

            if ($exchange->getType() === 'achat') {
                $entree = $exchange->getToAmount();
            } else {
                $sortie = $exchange->getFromAmount();
            }

            $transactions[] = [
                'id' => $exchange->getId(),
                'date' => $exchange->getDate()->format('Y-m-d H:i:s'),
                'description' => "Échange {$exchange->getType()}",
                'entree' => $entree,
                'sortie' => $sortie,
                'devise' => $agence->getDevise()
            ];
        }
    }

    // calcul du solde initial (somme des entrées - sorties avant la période)
    $initialBalance = 0;
    if ($start) {
        $query = $exchangeRepository->createQueryBuilder('e')
            ->where('e.agence IS NOT NULL')
            ->andWhere('e.date < :start')
            ->setParameter('start', $start);

        if ($id > 0) {
            $query->andWhere('e.agence = :agence')
                ->setParameter('agence', $id);
        }

        $previous = $query->getQuery()->getResult();

        foreach ($previous as $ex) {
            if ($id === 0) {
                $initialBalance += ($ex->getType() === 'achat') ? -$ex->getFromAmount() : $ex->getFromAmount();
            } else {
                $initialBalance += ($ex->getType() === 'achat') ? $ex->getToAmount() : -$ex->getToAmount();
            }
        }
    }

    // calcul progressif des soldes
    $solde = $initialBalance;
    foreach ($transactions as &$tx) {
        $solde += $tx['entree'] - $tx['sortie'];
        $tx['solde'] = $solde;
    }

    return new JsonResponse([
        'data' => $transactions,
        'initial' => $initialBalance
    ]);
}

}

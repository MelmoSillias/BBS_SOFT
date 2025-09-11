<?php

namespace App\Controller;

use App\Entity\CaseDocs;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use App\Entity\Client;
use App\Entity\Invoice;
use App\Entity\Task;
use App\Entity\Transfert;
use App\Entity\User;
use App\Repository\AccountTransactionRepository;
use App\Repository\AgenceRepository;
use App\Repository\CaseDocsRepository;
use App\Repository\ClientRepository;
use App\Repository\ExchangeRepository;
use App\Repository\InvoiceRepository;
use App\Repository\TaskRepository;
use App\Repository\TransfertRepository;
use DateTime;
use DateTimeImmutable;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Messenger\Transport\Serialization\SerializerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Http\Attribute\CurrentUser;
use Symfony\Component\Validator\Constraints\DateTime as ConstraintsDateTime;

final class DashboardController extends AbstractController
{
    #[Route('/dashboard', name: 'app_dashboard')]
    public function index(): Response
    {
        return $this->render('dashboard/index.html.twig', [
            'controller_name' => 'DashboardController',
        ]);
    }

    #[Route('/api/dashboard/{date}/stats', name: 'api_dashboard_stats', methods: ['GET'])]
    public function getStats(
        string $date,
        AgenceRepository $agenceRepository,
        ClientRepository $clientRepository,
        AccountTransactionRepository $transactionRepository,
        TransfertRepository $transfertRepository,
        ExchangeRepository $exchangeRepository,
        SerializerInterface $serializer
    ): JsonResponse {
        // Validate date format (YYYY-MM-DD)
        try {
            $dateObj = new DateTimeImmutable($date);
        } catch (\Exception $e) {
            return new JsonResponse(['error' => 'Invalid date format. Use YYYY-MM-DD.'], 400);
        }

        // Fetch the local agency (ID 1)
        $agence = $agenceRepository->find(1);
        if (!$agence) {
            return new JsonResponse(['error' => 'Local agency not found.'], 404);
        }

        // Initialize response structure
        $response = [
            'stats' => [],
            'pendingTransfers' => [],
            'balances' => [],
            'balanceEvolution' => [
                'labels' => ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
                'datasets' => []
            ],
            'operations' => [
                'labels' => [],
                'datasets' => []
            ]
        ];

        // Total Clients
        $totalClients = $clientRepository->count(['is_active' => true]);
        $response['stats']['totalClients'] = [
            'value' => $totalClients,
            'secondary' =>5 // Placeholder, to be calculated if historical data available
        ];

        // Capital CFA (sum of CFA transactions for the agency)
        $capitalCFA = $transactionRepository->createQueryBuilder('t')
            ->select('COALESCE(SUM(t.CFA), 0)')
            ->where('t.agence = :agence')
            ->setParameter('agence', $agence)
            ->getQuery()
            ->getSingleScalarResult();
        $response['stats']['capitalCFA'] = [
            'value' => (float) $capitalCFA,
            'secondary' => '+5% aujourd\'hui' // Placeholder
        ];

        // Daily Operations
        $dailyOperations = $transactionRepository->createQueryBuilder('t')
            ->where('t.agence = :agence')
            ->andWhere('t.createdAt >= :start')
            ->andWhere('t.createdAt < :end')
            ->setParameter('agence', $agence)
            ->setParameter('start', $dateObj->setTime(0, 0))
            ->setParameter('end', $dateObj->setTime(23, 59, 59))
            ->getQuery()
            ->getResult();
        $response['stats']['dailyOperations'] = [
            'value' => count($dailyOperations),
            'secondary' => '20 opérations en moyenne' // Placeholder
        ];

        // Daily Transfers
        $dailyTransfers = $transfertRepository->createQueryBuilder('t')
            ->where('t.agence = :agence')
            ->andWhere('t.createdAt >= :start')
            ->andWhere('t.createdAt < :end')
            ->setParameter('agence', $agence)
            ->setParameter('start', $dateObj->setTime(0, 0))
            ->setParameter('end', $dateObj->setTime(23, 59, 59))
            ->getQuery()
            ->getResult();
        $pendingCount = count(array_filter($dailyTransfers, fn($t) => $t->getStatus() === Transfert::STATUS_PENDING));
        $response['stats']['dailyTransfers'] = [
            'value' => count($dailyTransfers),
            'secondary' => "$pendingCount en attente de validation"
        ];

        // Daily Incomes and Outcomes
        $incomes = $transactionRepository->createQueryBuilder('t')
            ->select('COALESCE(SUM(t.CFA), 0)')
            ->where('t.agence = :agence')
            ->andWhere('t.createdAt >= :start')
            ->andWhere('t.createdAt < :end')
            ->andWhere('t.type = :type')
            ->setParameter('agence', $agence)
            ->setParameter('start', $dateObj->setTime(0, 0))
            ->setParameter('end', $dateObj->setTime(23, 59, 59))
            ->setParameter('type', 'income')
            ->getQuery()
            ->getSingleScalarResult();

        $outcomes = $transactionRepository->createQueryBuilder('t')
            ->select('COALESCE(SUM(t.CFA), 0)')
            ->where('t.agence = :agence')
            ->andWhere('t.createdAt >= :start')
            ->andWhere('t.createdAt < :end') 
            ->andWhere('t.type = :type')
            ->setParameter('agence', $agence)
            ->setParameter('start', $dateObj->setTime(0, 0))
            ->setParameter('end', $dateObj->setTime(23, 59, 59))
            ->setParameter('type', 'outcome')
            ->getQuery()
            ->getSingleScalarResult();
        $response['stats']['dailyIncomes'] = [
            'value' => (float) $incomes,
            'secondary' => '+8% par rapport à hier' // Placeholder
        ];
        $response['stats']['dailyOutcomes'] = [
            'value' => (float) $outcomes,
            'secondary' => '-5% par rapport à hier' // Placeholder
        ];

        // Total Exchanges
        $exchanges = $exchangeRepository->findAll();
        $deviseCounts = [];
        foreach ($exchanges as $exchange) {
            $devise = $exchange->getDevise();
            $deviseCounts[$devise] = ($deviseCounts[$devise] ?? 0) + 1;
        }
        $mostExchanged = !empty($deviseCounts) ? array_keys($deviseCounts, max($deviseCounts))[0] : 'USD';
        $response['stats']['totalExchanges'] = [
            'value' => count($exchanges),
            'secondary' => "Devise la plus échangée : $mostExchanged"
        ];

        // Client Operations
        $clientOperations = $transactionRepository->createQueryBuilder('t')
            ->where('t.agence = :agence')
            ->andWhere('t.client IS NOT NULL')
            ->setParameter('agence', $agence)
            ->getQuery()
            ->getResult();
        $response['stats']['clientOperations'] = [
            'value' => count($clientOperations),
            'secondary' => '+6% ce mois' // Placeholder
        ];

        // Pending Transfers
        $pendingTransfers = $transfertRepository->createQueryBuilder('t')
            ->where('t.agence = :agence')
            ->andWhere('t.status = :status')
            ->andWhere('t.createdAt >= :start')
            ->andWhere('t.createdAt < :end')
            ->setParameter('agence', $agence)
            ->setParameter('status', Transfert::STATUS_PENDING)
            ->setParameter('start', $dateObj->setTime(0, 0))
            ->setParameter('end', $dateObj->setTime(23, 59, 59))
            ->getQuery()
            ->getResult();
        $response['pendingTransfers'] = array_map(fn($t) => [
            'id' => $t->getId(),
            'reference' => $t->getRef(),
            'client' => $t->getClient() ? $t->getClient()->getNomComplet() : $t->getSenderName(),
            'amount' => (float) $t->getMontantCFA(),
            'currency' => 'FCFA',
            'date' => $t->getCreatedAt()->format('Y-m-d'),
            'destination' => $t->getAgence()->getDesignation()
        ], $pendingTransfers);

        // Balances
        $currencies = ['CFA', 'USD', 'EUR'];
        $conversionRates = [
            'USD' => 600, // Example rate: 1 USD = 600 FCFA
            'EUR' => 656, // Example rate: 1 EUR = 656 FCFA 
        ];
        foreach ($currencies as $currency) {
            $balance = $transactionRepository->createQueryBuilder('t')
                ->select("COALESCE(SUM(t.$currency), 0)")
                ->where('t.agence = :agence')
                ->setParameter('agence', $agence)
                ->getQuery()
                ->getSingleScalarResult();
            $equivalent = $currency === 'FCFA' ? $balance : $balance * ($conversionRates[$currency] ?? 1);
            $response['balances'][] = [
                'currency' => $currency,
                'balance' => (float) $balance,
                'equivalent' => (float) $equivalent,
                'trend' => 'stable' // Placeholder
            ];
        }

        // Balance Evolution (last 7 days)
        $balanceData = [];
        for ($i = 6; $i >= 0; $i--) {
            $day = (clone $dateObj)->modify("-$i days");
            $start = $day->setTime(0, 0);
            $end = $day->setTime(23, 59, 59);
            foreach (['CFA', 'USD'] as $currency) {
                $balance = $transactionRepository->createQueryBuilder('t')
                    ->select("COALESCE(SUM(t.$currency), 0)")
                    ->where('t.agence = :agence')
                    ->andWhere('t.createdAt <= :end')
                    ->setParameter('agence', $agence)
                    ->setParameter('end', $end)
                    ->getQuery()
                    ->getSingleScalarResult();
                $balanceData[$currency][] = (float) $balance / ($currency === 'FCFA' ? 1000 : 1);
            }
        }
        $response['balanceEvolution']['datasets'] = [
            [
                'label' => 'FCFA (milliers)',
                'data' => $balanceData['CFA'],
                'borderColor' => '#3498db',
                'backgroundColor' => 'rgba(52, 152, 219, 0.1)',
                'tension' => 0.3,
                'fill' => true
            ],
            [
                'label' => 'USD (milliers)',
                'data' => $balanceData['USD'],
                'borderColor' => '#27ae60',
                'backgroundColor' => 'rgba(39, 174, 96, 0.1)',
                'tension' => 0.3,
                'fill' => true
            ]
        ];

        // Operations (last 21 days, aggregated by 3-day periods)
        $operationsData = ['incomes' => [], 'outcomes' => []];
        $labels = [];
        for ($i = 21; $i >= 0; $i -= 3) {
            $start = (clone $dateObj)->modify("-$i days")->setTime(0, 0);
            $end = (clone $start)->modify('+2 days')->setTime(23, 59, 59);
            $labels[] = $start->format('d M');
            $incomes = $transactionRepository->createQueryBuilder('t')
                ->select('COALESCE(SUM(t.CFA), 0)')
                ->where('t.agence = :agence')
                ->andWhere('t.createdAt >= :start')
                ->andWhere('t.createdAt <= :end')
                ->andWhere('t.type = :type')
                ->setParameter('agence', $agence)
                ->setParameter('start', $start)
                ->setParameter('end', $end)
                ->setParameter('type', 'income')
                ->getQuery()
                ->getSingleScalarResult();
            $outcomes = $transactionRepository->createQueryBuilder('t')
                ->select('COALESCE(SUM(t.CFA), 0)')
                ->where('t.agence = :agence')
                ->andWhere('t.createdAt >= :start')
                ->andWhere('t.createdAt <= :end')
                ->andWhere('t.type = :type')
                ->setParameter('agence', $agence)
                ->setParameter('start', $start)
                ->setParameter('end', $end)
                ->setParameter('type', 'outcome')
                ->getQuery()
                ->getSingleScalarResult();
            $operationsData['incomes'][] = (float) $incomes;
            $operationsData['outcomes'][] = (float) $outcomes;
        }
        $response['operations']['labels'] = $labels;
        $response['operations']['datasets'] = [
            [
                'label' => 'Entrées (FCFA)',
                'data' => $operationsData['incomes'],
                'backgroundColor' => 'rgba(39, 174, 96, 0.7)'
            ],
            [
                'label' => 'Sorties (FCFA)',
                'data' => $operationsData['outcomes'],
                'backgroundColor' => 'rgba(231, 76, 60, 0.7)'
            ]
        ];

        return new JsonResponse($response);
    }

    
     #[Route('/dashboard/users/change-password', name: 'change_password', methods: ['POST'])]
        public function changePassword(
            Request $request,
            #[CurrentUser] User $user,
            UserPasswordHasherInterface $passwordHasher,
            EntityManagerInterface $em
        ): JsonResponse {
            // 1. Lecture du JSON
            try {
                $data = $request->toArray();
            } catch (\Throwable $e) {
                return $this->json([
                    'success' => false,
                    'message' => 'Payload JSON invalide.',
                ], 400);
            }

            $old     = $data['oldPassword']     ?? null;
            $new     = $data['newPassword']     ?? null;
            $confirm = $data['confirmPassword'] ?? null;

            // 2. Validation des champs
            if (! $old || ! $new || ! $confirm) {
                return $this->json([
                    'success' => false,
                    'message' => 'Tous les champs sont requis.',
                ], 422);
            }
            if (! $passwordHasher->isPasswordValid($user, $old)) {
                return $this->json([
                    'success' => false,
                    'message' => 'L’ancien mot de passe est incorrect.',
                ], 403);
            }
            if ($new !== $confirm) {
                return $this->json([
                    'success' => false,
                    'message' => 'La confirmation ne correspond pas.',
                ], 422);
            }

            // 3. Hash & persist
            $user->setPassword(
                $passwordHasher->hashPassword($user, $new)
            );
            $em->flush();

            return $this->json([
                'success' => true,
                'message' => 'Mot de passe mis à jour avec succès.',
            ], 200);
        }

    #[Route('/api/datatable_json_fr', name: 'get_frjson_datatable', methods: ['GET'])]
    public function getDataTableFrJson(): JsonResponse
    {
        $filePath = $this->getParameter('kernel.project_dir') . '/public/utils/dataTables_fr-FR.json';

        if (!file_exists($filePath)) {
            return $this->json(['error' => 'File not found'], Response::HTTP_NOT_FOUND);
        }

        $data = file_get_contents($filePath);
        $jsonData = json_decode($data, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return $this->json(['error' => 'Invalid JSON format'], Response::HTTP_BAD_REQUEST);
        }

        return $this->json($jsonData);
    }

    public function __construct(
        private EntityManagerInterface $em,
     
    ) {}  
}

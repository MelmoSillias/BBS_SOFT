<?php

namespace App\Repository;

use App\Entity\AccountTransaction;
use App\Entity\Agence;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<AccountTransaction>
 */
class AccountTransactionRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, AccountTransaction::class);
    }

    // AccountTransactionRepository.php

    public function findByFilters(?Agence $agence, ?\DateTimeImmutable $start, ?\DateTimeImmutable $end): array
    {
        $qb = $this->createQueryBuilder('t');

        if ($agence) {
            $qb->andWhere('t.agence = :agence')
            ->setParameter('agence', $agence);
        }

        if ($start) {
            $qb->andWhere('t.createdAt >= :start')
            ->setParameter('start', $start);
        }

        if ($end) {
            $qb->andWhere('t.createdAt <= :end')
            ->setParameter('end', $end);
        }

        return $qb
            ->orderBy('t.createdAt', 'ASC')
            ->addOrderBy('t.id', 'ASC')
            ->getQuery()
            ->getResult();
    }


    public function getSoldeInitial(?Agence $agence, string $devise, \DateTimeImmutable $startDate): float
    {
        $qb = $this->createQueryBuilder('t')
            ->select('SUM(t.' . $devise . ') as soldeInitial');

        if ($agence) {
            $qb->andWhere('t.agence = :agence')
                ->setParameter('agence', $agence);
        }

        $qb->andWhere('t.createdAt < :startDate')
            ->setParameter('startDate', $startDate);

        $result = $qb->getQuery()->getSingleScalarResult();

        return $result ? (float) $result : 0;
    }

    //    /**
    //     * @return AccountTransaction[] Returns an array of AccountTransaction objects
    //     */
    //    public function findByExampleField($value): array
    //    {
    //        return $this->createQueryBuilder('a')
    //            ->andWhere('a.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->orderBy('a.id', 'ASC')
    //            ->setMaxResults(10)
    //            ->getQuery()
    //            ->getResult()
    //        ;
    //    }

    //    public function findOneBySomeField($value): ?AccountTransaction
    //    {
    //        return $this->createQueryBuilder('a')
    //            ->andWhere('a.exampleField = :val')
    //            ->setParameter('val', $value)
    //            ->getQuery()
    //            ->getOneOrNullResult()
    //        ;
    //    }
}

<?php

namespace App\Repository;

use App\Entity\Exchange;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

/**
 * @extends ServiceEntityRepository<Exchange>
 */
class ExchangeRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Exchange::class);
    }

    public function findByFilters(array $filters): array
    {
        $qb = $this->createQueryBuilder('e');

        if (!empty($filters['status'])) {
            $qb->andWhere('e.status = :status')
               ->setParameter('status', $filters['status']);
        }

        if (!empty($filters['type'])) {
            $qb->andWhere('e.type = :type')
               ->setParameter('type', $filters['type']);
        }

        if (!empty($filters['agence'])) {
            $qb->join('e.agence', 'a')
               ->andWhere('a.id = :agence')
               ->setParameter('agence', $filters['agence']);
        }

        if (!empty($filters['startDate']) && !empty($filters['endDate'])) {
            $qb->andWhere('e.createdAt BETWEEN :start AND :end')
               ->setParameter('start', new \DateTime($filters['startDate']))
               ->setParameter('end', new \DateTime($filters['endDate']));
        }

        return $qb->getQuery()->getResult();
    }

//    /**
//     * @return Exchange[] Returns an array of Exchange objects
//     */
//    public function findByExampleField($value): array
//    {
//        return $this->createQueryBuilder('e')
//            ->andWhere('e.exampleField = :val')
//            ->setParameter('val', $value)
//            ->orderBy('e.id', 'ASC')
//            ->setMaxResults(10)
//            ->getQuery()
//            ->getResult()
//        ;
//    }

//    public function findOneBySomeField($value): ?Exchange
//    {
//        return $this->createQueryBuilder('e')
//            ->andWhere('e.exampleField = :val')
//            ->setParameter('val', $value)
//            ->getQuery()
//            ->getOneOrNullResult()
//        ;
//    }
}

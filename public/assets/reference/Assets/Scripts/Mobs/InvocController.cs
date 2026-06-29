using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class InvocController : MonoBehaviour
{
    public float LifePoints;
    public float MoveSpeed;
    public float MinAttackRange;
    public float MaxAttackRange;
    public float FireRate;
    public Rigidbody2D Projectile;
    public AudioClip Grrr;

    private Transform _target;
    private bool _reaching = false;
    private bool _hittedByPlayer = false;
    private bool _firing = false;
    private bool _hasGrrr = false;
    private AudioSource audio;
    
    // Start is called before the first frame update
    void Start()
    {
        _target = GameObject.FindGameObjectWithTag("Player").GetComponent<Transform>();
        audio = gameObject.GetComponent<AudioSource>();
    }

    // Update is called once per frame
    void Update()
    {
        // When the Player is within AttackRange, attack him and stay at constant distance
        float distToPlayer = Vector3.Distance(_target.position, transform.position);
        
        if (distToPlayer < MinAttackRange || _hittedByPlayer)
        {
            _reaching = true;
        }

        if (_reaching && distToPlayer >= MaxAttackRange)
        {
            transform.position = Vector2.MoveTowards( transform.position, _target.position, MoveSpeed * Time.deltaTime);
        }
        else if (_reaching && distToPlayer <= MinAttackRange)
        {
            transform.position = Vector2.MoveTowards( transform.position, _target.position, -1* MoveSpeed * Time.deltaTime);
        }
        else{}

        if (!_firing && _reaching)
        {
            _firing = true;
            InvokeRepeating("castProjectile", 0, FireRate);
        }

        if (_reaching && !_hasGrrr)
        {
            audio.clip = Grrr;
            audio.Play();
            _hasGrrr = true;
        }
    }

    public void castProjectile()
    {
        print("fire");
        Instantiate(Projectile, transform.position, transform.rotation);
    }
    
    void OnCollisionEnter2D(Collision2D col)
    {
        if (col.gameObject.tag.Equals("playerProjectile"))
        {
            _hittedByPlayer = true;

            Invoke("resetVelocity", 1.1f);
        }
    }
    
    void resetVelocity()
    {
        GetComponent<Rigidbody2D>().velocity = Vector3.zero;
    }
}